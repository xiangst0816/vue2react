import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { App, Lepus } from "./utils/types";
import {
  genPropTypes,
  genDefaultProps,
  genObjectExpressionFromObject,
  // getIdentifierFromTexts,
} from "./utils/tools";

const ReactComponents = [
  "View",
  "Image",
  "Text",
  "Input",
  "WebcastInput",
  "WebcastInputView",
  "ScrollView",
  "Swiper",
  "SwiperItem",
  "Picker",
  "InlineImage",
  "FilterImage",
  "InlineText",
  "Textarea",
  "List",
  "Header",
  "Footer",
  "SVG",
];

export default class ReactVisitor {
  app: App;

  constructor(app: any) {
    this.app = app;
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

  genImports(path: NodePath<t.Program>, hasStyle: boolean) {
    // add 'import ./index.css'
    if (hasStyle) {
      const importCSS = t.importDeclaration([], t.stringLiteral("./index.css"));
      path.node.body.unshift(importCSS);
    }

    this.app.script.imports.forEach((node) => {
      node.leadingComments = [];
      path.node.body.unshift(node);
    });

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

  genStaticProps(path: NodePath<t.ClassBody>) {
    path.node.body.push(genPropTypes(this.app.script.props));
    path.node.body.push(genDefaultProps(this.app.script.props));
  }

  genClassMethods(path: NodePath<t.ClassBody>) {
    const methods = {
      ...this.app.script.methods,
      // ...this.app.script.computed,
    };
    for (const name in methods) {
      if (methods.hasOwnProperty(name)) {
        path.node.body.push(methods[name]);
      }
    }

    // template
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

    console.log("template 中搜集的全部变量");
    console.log(attrsCollector);

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
      } else {
        console.log(
          `属性映射未识别，原样输出（也许是在 template 中的变量） ->`,
          attr
        );
      }
      // else if (this.app.script.computed[attr]) {
      //   computed.push(attr);
      // }
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

  genConfigProperty(path: NodePath<t.ClassBody>) {
    const config = this.app.config;
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
}
