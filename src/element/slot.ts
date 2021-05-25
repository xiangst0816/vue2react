import { anyObject, NodeType } from "../utils/types";
import * as t from "@babel/types";
import { getCollectedProperty } from "../utils/generatorUtils";
import _ from "lodash";
import { transformTextToExpression } from "../utils/tools";

export function genSlotElement(
  vnode: anyObject,
  attrsCollector: Readonly<Set<string>>
) {
  let slotNameElement;
  const slotNameAttr = (vnode.attrs || []).find(
    (node: anyObject) =>
      node.type === NodeType.Attribute && node.name === "name"
  );
  if (!slotNameAttr || slotNameAttr.length === 0) {
    // Support following syntax:
    // <slot></slot> -> {this.props.children}
    slotNameElement = t.identifier("children");
  } else {
    // Support following syntax:
    // <slot name="right"></slot> -> {this.props['renderRight']}
    // <slot name="drag-item-id-{{item.id}}"></slot> -> {this.props['renderDragItemId'+item.id]}
    slotNameElement = getCollectedProperty(
      (slotNameAttr.children || []).map((node: anyObject) => {
        if (node.type === NodeType.Mustache) {
          const { identifiers, expression } = transformTextToExpression(
            node.text
          );
          identifiers.forEach((i) => attrsCollector.add(i));
          return expression;
        } else if (node.type === NodeType.Text) {
          return t.stringLiteral(_.camelCase(`render-${node.text}`));
        } else if (node.type === NodeType.WhiteSpace) {
          return t.stringLiteral(" ");
        }
        debugger;
        return "";
      }),
      true
    );
  }

  if (t.isStringLiteral(slotNameElement)) {
    slotNameElement = t.identifier(slotNameElement.value);
  }

  if (t.isIdentifier(slotNameElement)) {
    return (t.jSXExpressionContainer(
      t.memberExpression(
        t.memberExpression(t.thisExpression(), t.identifier("props"), false),
        slotNameElement,
        false
      )
    ) as any) as t.JSXElement;
  }

  // 这种模式不支持，会影响 react-lynx 的解析
  // <slot name="drag-item-id-{{item.id}}"></slot>
  let slotSegment = "";
  (slotNameAttr.children || []).forEach((node: any) => {
    if (node.type === NodeType.Mustache) {
      slotSegment += `{{${node.text}}`;
    } else if (node.type === NodeType.Text) {
      slotSegment += node.text;
    }
  });

  const msg = `/* Not Support: <slot name="${slotSegment}"> */`;

  console.log(msg); // TODO: DOC
  return (t.jSXExpressionContainer(
    t.stringLiteral(msg)
  ) as any) as t.JSXElement;
}
