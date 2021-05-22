import { getCollectedProperty } from "../utils/generatorUtils";
import { anyObject, NodeType } from "../utils/types";
import * as t from "@babel/types";
import {transformTextToExpression} from "../utils/tools";

export function wrapForCommand(
  command: anyObject,
  vnode: anyObject,
  element: t.JSXElement,
  attrsCollector: Readonly<Set<string>>
) {
  const forIdentifier = getCollectedProperty(
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

  let forItemName = "item";
  const forItemNode: anyObject = vnode.commands.find(
    (i: anyObject) => i.name === "for-item"
  );
  if (forItemNode && forItemNode.children && forItemNode.children.length > 0) {
    const firstTextNode = forItemNode.children[0];
    if (firstTextNode.type === NodeType.Text) {
      forItemName = firstTextNode.text;
    } else {
      debugger;
    }
  }

  let forIndexName = "index";
  const forIndexNode: anyObject = vnode.commands.find(
    (i: anyObject) => i.name === "for-index"
  );
  if (
    forIndexNode &&
    forIndexNode.children &&
    forIndexNode.children.length > 0
  ) {
    const firstTextNode = forIndexNode.children[0];
    if (firstTextNode.type === NodeType.Text) {
      forIndexName = firstTextNode.text;
    } else {
      debugger;
    }
  }

  return t.jSXExpressionContainer(
    t.callExpression(t.memberExpression(forIdentifier, t.identifier("map")), [
      t.arrowFunctionExpression(
        [t.identifier(forItemName), t.identifier(forIndexName)],
        element
      ),
    ])
  );
}
