import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { App, Lepus } from "./utils/types";
import { ReactComponents } from "./common";
import {
  genPropTypes,
  genDefaultProps,
  genObjectExpressionFromObject,
  formatComponentName,
} from "./utils/tools";

export default class ReactVisitor {
  app: App;

  constructor(app: any) {
    this.app = app;
  }

  genTopStatement(path: NodePath<t.Program>) {
    this.app.script.topStatement.forEach((node) => {
      path.node.body.unshift(node);
    });
  }

  genLepusImports(path: NodePath<t.Program>, lepusImports: Lepus[]) {
    // add import { handleText } from './test.lepus';
    // add import { handleText1, handleText2 } from './test2.lepus';
    lepusImports.forEach((lepusImport) => {
      const importSpecifiers: string[][] = lepusImport.specifiers || [];
      const sourceString = lepusImport.path;

      if (sourceString && importSpecifiers.length > 0) {
        const importReactComponent = t.importDeclaration(
          importSpecifiers
            .map((specifier: string[]) => {
              let local: t.Identifier = t.identifier(specifier[0]);
              let imported: t.Identifier = t.identifier(specifier[1]);
              return t.importSpecifier(local, imported);
            })
            .filter((i: any) => Boolean(i)),
          t.stringLiteral(sourceString)
        );
        path.node.body.unshift(importReactComponent);
      }
    });
  }

  genComments(path: NodePath<t.Program>) {
    const contents = [
      " -------------------------------------",
      " 当前代码为自动生成，不建议在此基础上二次修改;",
      " The current code is automatically generated, ",
      " and it is not recommended to modify it twice on this basis",
      " -------------------------------------",
    ];
    contents.reverse().forEach((content) => {
      path.addComment("leading", content, true);
    });
  }

  genImports(path: NodePath<t.Program>, hasStyle: boolean) {
    // add custom component
    // { "arco-avatar": "@byted-lynx/ui/components/avatar/avatar" }
    // -> import ArcoAvatar from "@byted-lynx/ui/components/avatar/avatar.jsx";
    const usingComponents = this.app.config.usingComponents || {};
    if (usingComponents && Object.keys(usingComponents).length > 0) {
      Object.keys(usingComponents)
        .reverse()
        .forEach((name) => {
          path.node.body.unshift(
            t.importDeclaration(
              [
                t.importDefaultSpecifier(
                  t.identifier(formatComponentName(name))
                ),
              ],
              t.stringLiteral(`${usingComponents[name]}.jsx`)
            )
          );
        });
    }

    // add 'import ./index.css'
    if (hasStyle) {
      const importCSS = t.importDeclaration([], t.stringLiteral("./index.css"));
      path.node.body.unshift(importCSS);
    }

    // add 'import PropTypes from "PropType";'
    if (Object.keys(this.app.script.props).length) {
      const importPropTypes = t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier("PropTypes"))],
        t.stringLiteral("prop-types")
      );
      path.node.body.unshift(importPropTypes);
    }

    // add 'import { Text } from '@byted-lynx/react-components';'
    const importReactComponent = t.importDeclaration(
      ReactComponents.map((componentName) =>
        t.importSpecifier(
          t.identifier(componentName),
          t.identifier(componentName)
        )
      ),
      t.stringLiteral("@byted-lynx/react-components")
    );
    path.node.body.unshift(importReactComponent);

    // add 'import ReactLynx, { Component } from '@byted-lynx/react-runtime';'
    const importReact = t.importDeclaration(
      [
        t.importDefaultSpecifier(t.identifier("ReactLynx")),
        t.importSpecifier(t.identifier("Component"), t.identifier("Component")),
      ],
      t.stringLiteral("@byted-lynx/react-runtime")
    );

    path.node.body.unshift(importReact);
  }

  genStaticProps(path: NodePath<t.Program>) {
    path.node.body.push(
      genPropTypes(this.app.script.props, this.app.script.name)
    );
    path.node.body.push(
      genDefaultProps(this.app.script.props, this.app.script.name)
    );
  }

  genClassMethods(path: NodePath<t.ClassBody>) {
    const methods: Record<string, t.ClassMethod> = {
      ...this.app.script.methods,
      ...this.app.script.computed,
    };
    const eventsCollector = this.app.template.eventsCollector;

    for (const name in methods) {
      if (methods.hasOwnProperty(name)) {
        if (eventsCollector.has(name)) {
          // 绑定事件的函数
          // eventHandler = (_dataset) => (e) => {
          //   // maybe e.stopPropagation()
          //   e.currentTarget.dataset = _dataset;
          //   // .rest statement
          // }
          const stopPropagation = Boolean(
            eventsCollector.get(name)?.stopPropagation
          );
          const method = methods[name] as t.ClassMethod;
          const eventKey = method.key as t.Identifier;
          const eventParam = method.params[0] as t.Identifier | undefined;
          const eventBody = method.body.body;

          // e.stopPropagation()
          const stopPropagationExpressionStatement =
            eventParam && stopPropagation
              ? t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      eventParam,
                      t.identifier("stopPropagation")
                    ),
                    []
                  )
                )
              : t.emptyStatement();

          if (!eventParam) {
            debugger;
          }
          // e.currentTarget.dataset = _dataset;
          const datasetExpressionStatement = eventParam
            ? t.expressionStatement(
                t.assignmentExpression(
                  "=",
                  t.memberExpression(
                    t.memberExpression(
                      eventParam,
                      t.identifier("currentTarget")
                    ),
                    t.identifier("dataset")
                  ),
                  t.identifier("_dataset")
                )
              )
            : t.emptyStatement();

          const eventHandlerClassProperty = t.classProperty(
            eventKey,
            t.arrowFunctionExpression(
              [t.identifier("_dataset")],
              t.arrowFunctionExpression(
                eventParam ? [eventParam] : [],
                t.blockStatement([
                  stopPropagationExpressionStatement,
                  datasetExpressionStatement,
                  ...eventBody,
                ])
              )
            )
          );

          path.node.body.push(eventHandlerClassProperty);
        } else {
          // 普通函数
          // onLoad() {}
          path.node.body.push(methods[name]);
        }
      }
    }

    // [Component] observer 需要在 componentDidMount 和 componentDidUpdate
    // 中注入对应触发函数 this._propertyObserver();
    if (this.app.config["component"]) {
      let componentDidMountNode = (path.node.body.find((node) => {
        return (
          t.isClassMethod(node) &&
          t.isIdentifier(node.key) &&
          node.key.name === "componentDidMount"
        );
      }) as any) as t.ClassMethod | undefined;

      // 1. create -> componentDidMount(){}
      if (!componentDidMountNode) {
        componentDidMountNode = t.classMethod(
          "method",
          t.identifier("componentDidMount"),
          [],
          t.blockStatement([])
        );
        path.node.body.push(componentDidMountNode);
      }

      // 2. add -> componentDidMount(){this._propertyObserver(this.props, Component.defaultProps);}
      componentDidMountNode.body.body.unshift(
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.thisExpression(),
              t.identifier("_propertyObserver")
            ),
            [
              t.memberExpression(t.thisExpression(), t.identifier("props")),
              t.memberExpression(
                t.identifier(formatComponentName(this.app.script.name)),
                t.identifier("defaultProps")
              ),
            ]
          )
        )
      );

      // 3. create+add -> componentDidUpdate(prevProps){this._propertyObserver(this.props, prevProps);}
      const componentDidUpdateNode = t.classMethod(
        "method",
        t.identifier("componentDidUpdate"),
        [t.identifier("prevProps")],
        t.blockStatement([
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.thisExpression(),
                t.identifier("_propertyObserver")
              ),
              [
                t.memberExpression(t.thisExpression(), t.identifier("props")),
                t.identifier("prevProps"),
              ]
            )
          ),
        ])
      );
      path.node.body.push(componentDidUpdateNode);
    }

    // [Component] 中需要在 constructor 中注入 _lynxComponentCreated、_lynxComponentAttached 执行语句
    if (this.app.config["component"]) {
      const constructorStatementBody = (path.node.body.find(
        (node) => t.isClassMethod(node) && node.kind === "constructor"
      ) as t.ClassMethod).body.body;

      const lynxComponentCycleInjectToConstructor = [
        "_lynxComponentCreated",
        "_lynxComponentAttached",
      ];
      path.node.body.forEach((node) => {
        if (t.isClassMethod(node) && t.isIdentifier(node.key)) {
          if (lynxComponentCycleInjectToConstructor.includes(node.key.name)) {
            constructorStatementBody.push(
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.thisExpression(),
                    t.identifier(node.key.name)
                  ),
                  []
                )
              )
            );
          }
        }
      });
    }

    // template -> name 需要在拼好 renderXX 函数（已提前做好 ClassMethod）
    const templateCollector = this.app.template.templateCollector;
    templateCollector.forEach((template) => {
      path.node.body.push(template);
    });
  }

  genRenderMethods(path: NodePath<t.ClassBody>) {
    let blocks: t.Node[] = [];

    let dataProperties: t.ObjectProperty[] = [];
    let propProperties: t.ObjectProperty[] = [];
    let methodProperties: t.ObjectProperty[] = [];
    let computed: string[] = [];

    const attrsCollector = this.app.template.attrsCollector;

    attrsCollector.forEach((attr) => {
      if (this.app.script.data[attr]) {
        dataProperties.push(
          t.objectProperty(t.identifier(attr), t.identifier(attr), false, true)
        );
      } else if (this.app.script.props[attr]) {
        propProperties.push(
          t.objectProperty(t.identifier(attr), t.identifier(attr), false, true)
        );
      } else if (this.app.script.methods[attr]) {
        methodProperties.push(
          t.objectProperty(t.identifier(attr), t.identifier(attr), false, true)
        );
      } else if (this.app.script.computed[attr]) {
        computed.push(attr);
      } else {
        console.warn(`------------------------`);
        console.warn(
          `属性映射未识别，原样输出（也许是在 template 中的变量） ->`,
          attr
        );
        console.warn(`------------------------`);
      }

      return;
    });

    if (dataProperties.length > 0) {
      blocks.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.objectPattern(dataProperties as any),
            t.memberExpression(t.thisExpression(), t.identifier("state"))
          ),
        ])
      );
    }

    if (propProperties.length > 0) {
      blocks.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.objectPattern(propProperties as any),
            t.memberExpression(t.thisExpression(), t.identifier("props"))
          ),
        ])
      );
    }

    if (methodProperties.length > 0) {
      blocks.push(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.objectPattern(methodProperties as any),
            t.thisExpression()
          ),
        ])
      );
    }

    if (computed.length > 0) {
      computed.forEach((name) => {
        blocks.push(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier(name),
              t.callExpression(
                t.memberExpression(t.thisExpression(), t.identifier(name)),
                []
              )
            ),
          ])
        );
      });
    }

    blocks.push(t.returnStatement(this.app.template.ast));

    // generate render function
    const render = t.classMethod(
      "method",
      t.identifier("render"),
      [],
      t.blockStatement(blocks as t.Statement[])
    );

    path.node.body.push(render);
  }

  genPropertyObserverMethods(path: NodePath<t.ClassBody>) {
    if (!this.app.config["component"]) return;

    // if statements
    const observerList: t.IfStatement[] = [];
    this.app.script.observer.forEach((observer) => {
      const { name, bodyExpression, newValNode, oldValNode } = observer;
      const propsChangeStatement = t.ifStatement(
        t.binaryExpression(
          "!==",
          t.memberExpression(t.identifier("newProps"), t.identifier(name)),
          t.memberExpression(t.identifier("prevProps"), t.identifier(name))
        ),
        t.blockStatement([
          // const newVal = newProps['text'];
          newValNode
            ? t.variableDeclaration("let", [
                t.variableDeclarator(
                  newValNode,
                  t.memberExpression(
                    t.identifier("newProps"),
                    t.identifier(name)
                  )
                ),
              ])
            : t.emptyStatement(),
          // const oldVal = prevProps['text'];
          oldValNode
            ? t.variableDeclaration("let", [
                t.variableDeclarator(
                  oldValNode,
                  t.memberExpression(
                    t.identifier("prevProps"),
                    t.identifier(name)
                  )
                ),
              ])
            : t.emptyStatement(),
          ...bodyExpression,
        ])
      );
      observerList.push(propsChangeStatement);
    });

    // outer wrapper
    // _propertyObserver(newProps, prevProps) {
    //   ... if statements
    // }
    const outerWrapper = t.classMethod(
      "method",
      t.identifier("_propertyObserver"),
      [t.identifier("newProps"), t.identifier("prevProps")],
      t.blockStatement(observerList)
    );
    path.node.body.push(outerWrapper);
  }

  genConfigProperty(path: NodePath<t.ClassBody>) {
    const config = this.app.config;

    delete config.usingComponents;
    delete config.usingTemplateAPI;

    const objectExpression = genObjectExpressionFromObject(config || {});
    path.node.body.push(
      t.classProperty(t.identifier("config"), objectExpression)
    );
  }

  remapLepusMemberExpression(path: NodePath<t.MemberExpression>) {
    const lepusNames = this.app.lepus.map((i) => i.name) || [];
    // Support following syntax:
    // lepus template replace
    // <View style={{ ...this._styleStringToObject(_styleFn.sizeStyle(size)) }} >
    //   <Text>{_styleFn.sizeStyle(size)}</Text>
    // </View>
    // ->
    // <View style={{ ...this._styleStringToObject(sizeStyle(size)) }} >
    //   <Text>{sizeStyle(size)}</Text>
    // </View>
    if (
      t.isIdentifier(path.node.object) &&
      lepusNames.includes(path.node.object.name) &&
      t.isCallExpression(path.parent) &&
      t.isMemberExpression(path.parent.callee)
    ) {
      // is lepus identifier
      path.parent.callee = path.parent.callee.property;
    }
  }

  genSelfClosingElement(path: NodePath<t.JSXElement>) {
    if (
      path.node.children.length === 0 &&
      !path.node.openingElement.selfClosing
    ) {
      // Support following syntax:
      // <View></View> -> <View />
      path.node.openingElement.selfClosing = true;
    }
  }
}
