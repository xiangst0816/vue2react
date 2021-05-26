import * as t from "@babel/types";
import { NodePath } from "@babel/traverse";
import { LynxCardCycle, LynxComponentCycle } from "./common";
import logger from "./utils/logUtil";
import { Script, ScriptProps } from "./utils/types";
import formatThisExpression from "./formatThis";

export default class ScriptVisitor {
  script: Script;

  constructor() {
    this.script = {
      topStatement: [],
      name: "",
      data: {},
      props: new Map(),
      methods: {},
      computed: {},
      observer: [],
    };
  }

  // js 文件顶部的一些申明及语句，原样转移
  topModuleDeclarationsAndExpressionsHandler(
    path: t.ModuleDeclaration | t.Statement
  ) {
    this.script.topStatement.unshift(path);
  }

  nameHandler(path: NodePath<t.ObjectProperty>) {
    this.script.name = (path.node.value as t.StringLiteral).value;
  }

  dataHandler(body: t.Node[], isObject: boolean) {
    let propNodes: any[] = [];
    if (isObject) {
      this.script.data._statements = [].concat(body as any);
      propNodes = body as t.ObjectProperty[];
    } else {
      body.forEach((child) => {
        if (
          t.isReturnStatement(child) &&
          t.isObjectExpression(child.argument)
        ) {
          this.script.data._statements = [].concat(
            child.argument.properties as any
          );
          propNodes = child.argument.properties;
        }
      });
    }
    propNodes.forEach((propNode) => {
      this.script.data[propNode.key.name] = propNode;
    });
  }

  cardCycleMethodHandler(path: NodePath<t.ObjectMethod>) {
    const ttmlCycleName = (path.node.key as t.Identifier).name;
    const reactCycleName = LynxCardCycle[ttmlCycleName];
    if (reactCycleName) {
      const params: t.LVal[] = path.node.params;
      // 函数内 this 需要处理下（this.data/this.properties）
      const blockStatement = formatThisExpression(path, this.script);

      // TODO：onDataChanged；看文档, 这里只做数据搜集；

      this.script.methods[reactCycleName] = t.classMethod(
        "method",
        t.identifier(reactCycleName),
        params,
        blockStatement
      );
    } else {
      console.log(
        `ttml 卡片生命周期函数 ${ttmlCycleName} 没有对等的 ReactLynx 实现！`
      );
    }
  }

  componentCycleMethodHandler(path: NodePath<t.ObjectMethod>) {
    const ttmlCycleName = (path.node.key as t.Identifier).name;
    const reactCycleName = LynxComponentCycle[ttmlCycleName];
    if (reactCycleName) {
      const params: t.Identifier[] = [];
      // 函数内 this 需要处理下（this.data/this.properties）
      const blockStatement = formatThisExpression(path, this.script);
      this.script.methods[reactCycleName] = t.classMethod(
        "method",
        t.identifier(reactCycleName),
        params,
        blockStatement
      );
    } else {
      console.log(
        `ttml 组件生命周期函数 ${ttmlCycleName} 没有对等的 ReactLynx 实现！`
      );
    }
  }

  objectMethodHandler(path: NodePath<t.ObjectMethod>) {
    const name = (path.node.key as t.Identifier).name;
    let params = path.node.params;
    // 函数内 this 需要处理下（this.data/this.properties）
    const blockStatement = formatThisExpression(path, this.script);
    this.script.methods[name] = t.classMethod(
      "method",
      t.identifier(name),
      params,
      blockStatement
    );
  }

  computedHandler(path: NodePath<t.ObjectMethod>) {
    // 函数内 this 需要处理下（this.data/this.properties）
    const blockStatement = formatThisExpression(path, this.script);
    this.script.computed[(path.node.key as t.Identifier).name] = t.classMethod(
      "method",
      path.node.key,
      [],
      blockStatement
    );
  }

  propsHandler(path: NodePath<t.ObjectProperty>) {
    const nodeList = (path.node.value as t.ObjectExpression)
      .properties as t.ObjectMethod[];

    nodeList.forEach((node) => {
      const key = (node.key as t.Identifier).name;
      if (t.isIdentifier(node.value)) {
        // Support following syntax:
        // props: { title: Boolean }
        this.script.props.set(key, {
          type: node.value.name.toLowerCase(),
          typeValue: node.value.name.toLowerCase(),
          defaultValue: undefined,
          required: false,
          validator: false,
          observer: false,
        });
      } else if (t.isArrayExpression(node.value)) {
        // Support following syntax:
        // props: { title: [Boolean, String] }
        const types = node.value.elements.map((element) =>
          (element as t.Identifier).name.toLowerCase()
        );
        this.script.props.set(key, {
          type: types.length > 1 ? "typesOfArray" : types[0],
          typeValue: types.length > 1 ? types : types[0],
          defaultValue: undefined,
          required: false,
          validator: false,
          observer: false,
        });
      } else if (t.isObjectExpression(node.value)) {
        // Support following syntax:
        // title: {type: String, value: "title", observer(){}}
        // or
        // title: {type: [String, Number], value: "title"}
        this.script.props.set(key, {
          type: "any",
          typeValue: "any",
          defaultValue: undefined,
          required: false,
          validator: false,
          observer: false,
        });

        interface PropsThis {
          key: string;
          prop: ScriptProps;
          script: Script;
        }

        // recurse in ObjectExpression to deal with ObjectProperty and FunctionExpression
        const fetchPropsContent = {
          ObjectProperty(this: PropsThis, path: NodePath) {
            if (!t.isObjectProperty(path.parentPath.parent)) return;
            const gradparentKey = path.parentPath.parent.key;
            if (!gradparentKey || !t.isIdentifier(gradparentKey)) return;
            if (gradparentKey.name !== this.key) return;

            const node = path.node as t.ObjectProperty;
            const name = (node.key as t.Identifier).name;
            switch (name) {
              case "type":
                if (t.isIdentifier(node.value)) {
                  // Support following syntax:
                  // title: {type: String}
                  this.prop.type = node.value.name.toLowerCase();
                  this.prop.typeValue = this.prop.type;
                } else if (t.isArrayExpression(node.value)) {
                  // Support following syntax:
                  // title: {type: [String, Number]}
                  const types = node.value.elements.map((element) =>
                    (element as t.Identifier).name.toLowerCase()
                  );
                  this.prop.type = types.length > 1 ? "typesOfArray" : types[0];
                  this.prop.typeValue = types.length > 1 ? types : types[0];
                } else {
                  logger.log(
                    `The type in ${this.key} prop only supports identifier or array expression, eg: Boolean, [String]`,
                    "info"
                  );
                }
                break;
              case "value":
                if (
                  t.isStringLiteral(node.value) ||
                  t.isBooleanLiteral(node.value) ||
                  t.isNumericLiteral(node.value)
                ) {
                  this.prop.defaultValue = node.value.value;
                } else if (
                  t.isArrayExpression(node.value) ||
                  t.isObjectExpression(node.value)
                ) {
                  this.prop.defaultValue = node.value;
                } else if (t.isNullLiteral(node.value)) {
                  this.prop.defaultValue = null;
                }
                break;
              default:
                break;
            }
          },
          ObjectMethod(this: PropsThis, path: NodePath<t.ObjectMethod>) {
            if (!t.isObjectProperty(path.parentPath.parent)) return;

            const gradparentKey = path.parentPath.parent.key;

            if (!gradparentKey || !t.isIdentifier(gradparentKey)) return;
            if (gradparentKey.name !== this.key) return;
            if (!t.isIdentifier(path.node.key)) return;
            if (path.node.key.name !== "observer") return;

            // Support following syntax:
            // {type: String, value: "title", observer(){}}
            // {type: String, value: "title", observer:function(){}}
            // {type: String, value: "title", observer:()=>{}}
            let newValNode: t.Identifier | undefined;
            let oldValNode: t.Identifier | undefined;
            if (path.node.params[0]) {
              if (t.isIdentifier(path.node.params[0])) {
                newValNode = path.node.params[0];
              } else if (
                t.isAssignmentPattern(path.node.params[0]) &&
                t.isIdentifier(path.node.params[0].left)
              ) {
                newValNode = path.node.params[0].left;
              }
            }

            if (path.node.params[1]) {
              if (t.isIdentifier(path.node.params[1])) {
                oldValNode = path.node.params[1];
              } else if (
                t.isAssignmentPattern(path.node.params[1]) &&
                t.isIdentifier(path.node.params[1].left)
              ) {
                oldValNode = path.node.params[1].left;
              }
            }

            // 函数内 this 需要处理下（this.data/this.properties）
            const blockStatement = formatThisExpression(path, this.script);
            let bodyExpression: t.Statement[] = [];
            if (t.isBlockStatement(blockStatement)) {
              bodyExpression = blockStatement.body;
            }

            this.prop.observer = true;
            this.script.observer.push({
              name: this.key,
              newValNode,
              oldValNode,
              bodyExpression,
            });
          },
        };

        path.traverse(fetchPropsContent, {
          prop: this.script.props.get(key),
          key,
          script: this.script,
        } as PropsThis);
      } else {
        logger.log(
          `Not supports expression for the ${key} prop in props.`,
          "info"
        );
      }
    });
  }
}
