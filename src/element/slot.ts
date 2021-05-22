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

  // 直接返回 jsx 表达式
  return (t.jSXExpressionContainer(
    t.memberExpression(
      t.memberExpression(t.thisExpression(), t.identifier("props"), false),
      slotNameElement,
      true
    )
  ) as any) as t.JSXElement;

  // 进行包裹
  // return t.jSXElement(
  //   t.jSXOpeningElement(t.jSXIdentifier("View"), []),
  //   t.jSXClosingElement(t.jSXIdentifier("View")),
  //   [
  //     t.jSXExpressionContainer(
  //       t.memberExpression(
  //         t.memberExpression(t.thisExpression(), t.identifier("props"), false),
  //         slotNameElement,
  //         true
  //       )
  //     ),
  //   ]
  // );
}
