import * as t from "@babel/types";
import { getCollectedProperty } from "../utils/generatorUtils";
import { anyObject, NodeType } from "../utils/types";
import jsxElementGenerator from "../jsxElementGenerator";
import { transformTextToExpression } from "../utils/tools";

export function injectElseCommand(
  command: anyObject,
  vnode: anyObject,
  element: t.JSXElement,
  parentElement: t.JSXElement | undefined,
  attrsCollector: Readonly<Set<string>>,
  templateCollector: Readonly<Set<t.ClassMethod>>,
) {
  // Support following syntax:
  // <div tt:if="{show}"/><div tt:else/> -> {show ? <div/> : <div/>}
  // <div tt:if="{show1}"/><div tt:elif="{show2}"/><div tt:else/> -> {show1 ? <div/>: show2 ? <div/> : <div/>}
  const parentJsxElementChildren = parentElement?.children || [];

  // if-else 最合适的挂载点
  let previousConditionalExpression: t.ConditionalExpression | undefined;

  if (!parentJsxElementChildren || parentJsxElementChildren.length === 0) {
    throw new Error("[else] 没有父节点，ttml 代码格式异常");
  }

  // 从后向前找， 在 if 中挂载 else、elis
  for (let i = parentJsxElementChildren.length; i > 0; i--) {
    const node = parentJsxElementChildren[i - 1];
    if (
      node.type === "JSXExpressionContainer" &&
      node.expression &&
      node.expression.type === "ConditionalExpression"
    ) {
      previousConditionalExpression = node.expression;

      // 找到不是 ConditionalExpression 的位置（也就是 nullLiteral）
      while (
        previousConditionalExpression &&
        t.isConditionalExpression(previousConditionalExpression?.alternate)
      ) {
        previousConditionalExpression =
          previousConditionalExpression?.alternate;
      }

      // 再次检查
      if (!t.isNullLiteral(previousConditionalExpression?.alternate)) {
        previousConditionalExpression = undefined;
        debugger;
      } else {
        // 找到合法的 if 挂载点
        break;
      }
    }
  }

  if (!previousConditionalExpression) {
    throw new Error("[else] 未找到前置的 if/elif 节点的 t.nullLiteral() 节点");
  }

  if (command.name === "else") {
    previousConditionalExpression.alternate = element;
  } else if (command.name === "elif") {
    const test = getCollectedProperty(
      (command.children || []).map((node: anyObject) => {
        if (node.type === NodeType.Mustache) {
          // Mustache
          const { identifiers, expression } = transformTextToExpression(
            node.text
          );
          identifiers.forEach((i) => attrsCollector.add(i));
          return expression;
        } else if (node.type === NodeType.Text) {
          // Text
          return t.stringLiteral(node.text);
        } else if (node.type === NodeType.WhiteSpace) {
          // WhiteSpace
          return t.stringLiteral(" ");
        }

        debugger;
        return "";
      })
    );

    if (test) {
      // Normal: <view tt:elif="{{name}}"></view>
      previousConditionalExpression.alternate = t.conditionalExpression(
        test,
        element,
        previousConditionalExpression.alternate
      );
    } else {
      // Abnormal: <view tt:elif></view> -> <view tt:else></view>
      previousConditionalExpression.alternate = element;
    }
  }

  // 递归一次子组件
  if (vnode.children && vnode.children.length > 0) {
    vnode.children.forEach((child: anyObject) => {
      jsxElementGenerator(
        child,
        element,
        attrsCollector,
        templateCollector,
      );
    });
  }
}
