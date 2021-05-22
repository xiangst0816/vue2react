import { getCollectedProperty } from "../utils/generatorUtils";
import { anyObject, NodeType } from "../utils/types";
import * as t from "@babel/types";
import { transformTextToExpression } from "../utils/tools";

export function wrapIfCommand(
  command: anyObject,
  element: t.JSXElement,
  attrsCollector: Readonly<Set<string>>
) {
  // Support following syntax:
  // <div tt:if="show"/> -> {show ? <div/> : null}
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

  if (
    t.isJSXExpressionContainer(element as any) &&
    t.isMemberExpression(
      ((element as any) as t.JSXExpressionContainer).expression
    )
  ) {
    // Support following syntax:
    // { this.renderTemplate } -> { test ? this.renderTemplate : null }
    return t.jSXExpressionContainer(
      t.conditionalExpression(
        test,
        ((element as any) as t.JSXExpressionContainer).expression,
        t.nullLiteral()
      )
    );
  }

  return t.jSXExpressionContainer(
    t.conditionalExpression(test, element, t.nullLiteral())
  );
}
