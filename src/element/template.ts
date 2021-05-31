import { anyObject, NodeType } from "../utils/types";
import { getTemplateComponentName } from "../utils/tools";
import * as t from "@babel/types";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import jsxElementGenerator from "../jsxElementGenerator";
import { EmptyTag } from "../common";
import logger from "../utils/logUtil";

export function isTemplateNameAttr(vnode: anyObject) {
  return Boolean(getTemplateNameAttr(vnode));
}

export function isTemplateIsAttr(vnode: anyObject) {
  return Boolean(getTemplateIsAttr(vnode));
}

export function getTemplateNameAttr(vnode: anyObject) {
  return (vnode.attrs || []).find(
    (node: anyObject) =>
      node.type === NodeType.Attribute && node.name === "name"
  );
}

export function getTemplateIsAttr(vnode: anyObject) {
  return (vnode.attrs || []).find(
    (node: anyObject) => node.type === NodeType.Attribute && node.name === "is"
  );
}

export function getTemplateDataAttr(vnode: anyObject) {
  return (vnode.attrs || []).find(
    (node: anyObject) =>
      node.type === NodeType.Attribute && node.name === "data"
  );
}

export function collectTemplateRenderMethods(
  vnode: anyObject,
  templateCollector: Readonly<Set<t.ClassMethod>>
): void {
  const templateNameAttr = getTemplateNameAttr(vnode);
  if (
    templateNameAttr.children.length === 1 &&
    templateNameAttr.children[0] &&
    templateNameAttr.children[0].type === NodeType.Text
  ) {
    // template name 属性必须是字符串
    const node = templateNameAttr.children[0];
    const templateComponentName = getTemplateComponentName(node.text);
    // 在 children 中找第一个有效的 element
    let templateNode: anyObject;
    const elementList = (vnode.children || []).filter(
      (node: anyObject) => node.type === NodeType.Element
    );
    if (elementList.length === 1) {
      // Support following syntax:
      // generate template component into templateCollector
      // <template name="msgItem">
      //   <text>{{aa}}</text>
      // </template>
      // ->
      // class xxx {
      //   renderMsgItemTemplateComponent (data) {
      //     const { aa } = data;
      //     return(<Text>{aa}</Text>)
      //   }
      // }
      templateNode = elementList[0];
    } else {
      // Support following syntax:
      // generate template component into templateCollector
      // <template name="msgItem">
      //   <text>{{aa}}</text>
      //   <text>{{aa}}</text>
      // </template>
      // ->
      // class xxx {
      //   renderMsgItemTemplateComponent (data) {
      //     const { aa } = data;
      //     return (
      //       <EmptyTag>
      //         <Text>{aa}</Text>
      //         <Text>{aa}</Text>
      //       </EmptyTag>
      //     )
      //   }
      // }
      templateNode = vnode;
      templateNode.tag = EmptyTag; // 默认给个 EmptyTag = view
      templateNode.attrs = []; // 清除属性
      // logger.log(
      //   `[Warn] 边界提示，template 里面的元素建议包裹一层，不建议罗列，因为 LynxReact 这边没有 Fragment 组件`
      // );
    }

    // 遍历完 template 内部节点
    const {
      ast: templateJsxElement,
      attrsCollector: _attrsCollector,
    } = jsxElementGenerator(
      templateNode,
      undefined,
      new Set(),
      new Set(),
      new Map(),
      new Map(),
      new Set()
    );

    let dataProperties: t.ObjectProperty[] = [
      ...(_attrsCollector as Set<string>),
    ].map((attr) =>
      t.objectProperty(t.identifier(attr), t.identifier(attr), false, true)
    );

    let returnStatement: t.ReturnStatement;
    if (
      t.isJSXExpressionContainer(templateJsxElement) &&
      t.isExpression(templateJsxElement.expression)
    ) {
      returnStatement = t.returnStatement(templateJsxElement.expression);
    } else if (t.isExpression(templateJsxElement)) {
      returnStatement = t.returnStatement(templateJsxElement);
    } else {
      returnStatement = t.returnStatement();
    }

    templateCollector.add(
      t.classMethod(
        "method",
        t.identifier(templateComponentName),
        [t.identifier("data")],
        t.blockStatement([
          // data mapping
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.objectPattern(dataProperties), // TODO: check type
              t.identifier("data")
            ),
          ]),
          // sub template
          returnStatement,
        ])
      )
    );
  } else {
    throw new Error(
      "[template] template name 属性必须是字符串, 边界条件需要核对"
    );
  }
}

export function genTemplateElement(
  vnode: anyObject
): t.JSXElement | t.JSXExpressionContainer {
  let element: t.JSXElement | t.JSXExpressionContainer; // 当前 element

  const templateIsAttr = getTemplateIsAttr(vnode);
  const templateDataAttr = getTemplateDataAttr(vnode);

  // Support following syntax:
  // generate a component
  // 因为 name 必须是 [字符串]，所以 is 这里也只能是 [字符串] 或者 [(三元)表达式+字符串], 不支持字符串拼接；
  // <template is="msgItem" data="{{item,index}}" />
  // ->
  // { this.renderEvenTemplateComponent({item,index}) }
  //
  // <template is="{{item % 2 == 0 ? 'even' : 'odd'}}" data="{{item,index}}" />
  // ->
  // { item % 2 == 0 ? this.renderEvenTemplateComponent({item,index}):this.renderOddTemplateComponent({item,index}) }
  if (
    templateIsAttr.children.length === 1 &&
    templateIsAttr.children[0] &&
    (templateIsAttr.children[0].type === NodeType.Text ||
      templateIsAttr.children[0].type === NodeType.Mustache)
  ) {
    const text = templateIsAttr.children[0].text;
    const data = `var a = {${templateDataAttr.children[0].text}}`; // "...data", "a:b,c:d", "a,b"

    let dataObjectExpression: t.ObjectExpression;
    const dataAst = parser.parse(data);
    if (
      t.isVariableDeclaration(dataAst.program.body[0]) &&
      t.isVariableDeclarator(dataAst.program.body[0].declarations[0]) &&
      t.isObjectExpression(dataAst.program.body[0].declarations[0].init)
    ) {
      dataObjectExpression = dataAst.program.body[0].declarations[0].init;
    }

    const textAst = parser.parse(text);
    traverse(textAst, {
      ExpressionStatement(path) {
        if (t.isIdentifier(path.node.expression)) {
          const text = path.node.expression.name;
          const templateComponentName = getTemplateComponentName(text);
          path.replaceWith(
            t.callExpression(
              t.memberExpression(
                t.thisExpression(),
                t.identifier(templateComponentName)
              ),
              [dataObjectExpression]
            )
          );
        }
      },
      StringLiteral(path) {
        const text = path.node.value;
        const templateComponentName = getTemplateComponentName(text);
        path.replaceWith(
          t.callExpression(
            t.memberExpression(
              t.thisExpression(),
              t.identifier(templateComponentName)
            ),
            [dataObjectExpression]
          )
        );
      },
    });

    if (
      t.isExpressionStatement(textAst.program.body[0]) &&
      (t.isConditionalExpression(textAst.program.body[0].expression) ||
        t.isCallExpression(textAst.program.body[0].expression) ||
        t.isLogicalExpression(textAst.program.body[0].expression))
    ) {
      // 直接返回 jsx 表达式
      element = t.jSXExpressionContainer(textAst.program.body[0].expression);
    } else {
      throw new Error("[template] is 属性没找到有效的表达式");
    }
  } else {
    throw new Error('[template] <template is="????"> 还有其他形式？这里未处理');
  }

  return element;
}
