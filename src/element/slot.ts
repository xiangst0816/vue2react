import { anyObject, NodeType, ScriptProps } from "../utils/types";
import * as t from "@babel/types";
import _ from "lodash";
import logger from "../utils/logUtil";
import {
  getCollectedProperty,
  transformTextToExpression,
} from "../utils/tools";

export function genSlotElement(
  vnode: anyObject,
  attrsCollector: Readonly<Set<string>>,
  slotsCollector: Readonly<Map<string, ScriptProps>>
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
    // slot 信息搜集
    const renderName = slotNameElement.name; // renderXx
    if (!slotsCollector.has(renderName)) {
      slotsCollector.set(renderName, {
        type: "element",
        typeValue: "element",
        defaultValue: null,
        required: false,
        validator: false,
        observer: false,
      });
    }

    return t.jSXExpressionContainer(
      t.memberExpression(
        t.memberExpression(t.thisExpression(), t.identifier("props"), false),
        slotNameElement,
        false
      )
    );
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

  logger.log(`[log] Not Support: <slot name="${slotSegment}">`); // TODO: DOC
  return t.jSXExpressionContainer(t.jSXEmptyExpression());
}
