import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import _ from "lodash";
import { Script } from "./utils/types";
import generate from "@babel/generator";

/*
  Support following syntax:
  this.name -> this.state.name/this.props.name
  this.name = 'tom' -> this.setState({name: 'jerry'})
  const { name } = this -> const { name } = this.state
  ...
*/
const replaceThisExpression = {
  ThisExpression(
    this: { script: Script },
    thisExpressionNodePath: NodePath<t.ThisExpression>
  ) {
    // here is -> this.xxx
    if (
      thisExpressionNodePath.parent &&
      t.isMemberExpression(thisExpressionNodePath.parent)
    ) {
      if (
        t.isIdentifier(thisExpressionNodePath.parent.property) &&
        thisExpressionNodePath.parent.property.name
      ) {
        const thisPropertyName = thisExpressionNodePath.parent.property.name;
        if (thisPropertyName === "setData") {
          // Support following syntax:
          // this.setData({name:'Tom'}) -> this.setState({name: 'Tom'})
          thisExpressionNodePath.parent.property.name = "setState";
        } else if (
          thisExpressionNodePath.parent.property.name === "data" ||
          thisExpressionNodePath.parent.property.name === "properties"
        ) {
          let replacedName: string;
          if (thisExpressionNodePath.parent.property.name === "data") {
            replacedName = "state";
          } else {
            replacedName = "props";
          }
          // Support following syntax:
          // Fix the problem of mixing usage of data and properties
          // this.data.name -> this.state.name/this.props.name
          // this.properties.name -> this.state.name/this.props.name
          if (
            t.isMemberExpression(thisExpressionNodePath.parentPath.parent) &&
            t.isIdentifier(thisExpressionNodePath.parentPath.parent.property) &&
            thisExpressionNodePath.parentPath.parent.property.name
          ) {
            let name: string =
              thisExpressionNodePath.parentPath.parent.property.name;
            if (this.script.data[name]) {
              replacedName = "state";
            } else if (this.script.props.has(name)) {
              replacedName = "props";
            }
          }

          // Support following syntax:
          // 这里不支持 data/properties 推断
          // const { speed } = this.properties -> const { speed } = this.props;
          // const { name } = this.data -> const { name } = this.state;
          thisExpressionNodePath.parent.property.name = replacedName;
        } else if (
          thisPropertyName === "triggerEvent" &&
          t.isCallExpression(thisExpressionNodePath.parentPath.parent)
        ) {
          // Support following syntax:
          // this.triggerEvent("change", {}) -> this.props.onChange && this.props.onChange({})
          // TODO: DOC 不支持字符串之外的写法

          const callExpression = thisExpressionNodePath.parentPath.parent;
          const eventName = t.isStringLiteral(callExpression.arguments[0])
            ? _.camelCase(`on-${callExpression.arguments[0].value}`)
            : "";
          const eventData = callExpression.arguments[1];

          if (!eventName) {
            const res = generate(callExpression).code;
            throw new Error(`NOTICE: 当前语法不支持转换，请检查: ${res}`);
          } else if (
            t.isExpressionStatement(
              thisExpressionNodePath.parentPath.parentPath.parent
            )
          ) {
            // props 属性记录
            this.script.props.set(eventName, {
              type: "func",
              typeValue: "func",
              defaultValue: null,
              required: false,
              validator: false,
              observer: false,
            });

            thisExpressionNodePath.parentPath.parentPath.parent.expression = t.logicalExpression(
              "&&",
              t.memberExpression(
                t.memberExpression(t.thisExpression(), t.identifier("props")),
                t.identifier(eventName)
              ),
              t.callExpression(
                t.memberExpression(
                  t.memberExpression(t.thisExpression(), t.identifier("props")),
                  t.identifier(eventName)
                ),
                eventData ? [eventData] : []
              )
            );
          }
        }
      }
    }

    thisExpressionNodePath.stop();
  },
};

export default function formatThisExpression(
  path: NodePath<t.ObjectMethod>,
  script: Script
): t.BlockStatement {
  let block: t.Statement[] = [];
  path.traverse(
    {
      enter(subpath) {
        subpath.traverse(replaceThisExpression, { script });
        if (
          subpath.parentPath.parent === path.node &&
          t.isStatement(subpath.node)
        ) {
          block.push(subpath.node);
        }
      },
    },
    { script, block }
  );

  return t.blockStatement(block);
}
