import { anyObject, EventsCollector, NodeType } from "../utils/types";
import * as t from "@babel/types";
import { lynxEventReMap } from "../utils/eventMap";
import _ from "lodash";
import {
  getCollectedProperty,
  transformTextToExpression,
} from "../utils/tools";

// 只能转为 style 对象，如果是 style 字符串，marquee 组件会有问题；
function collectStyleAttrs(
  attr: anyObject,
  attrsCollector: Readonly<Set<string>>,
  styleAttrs: t.JSXAttribute[]
) {
  const styleDeclarations = attr.children;
  if (styleDeclarations && styleDeclarations.length > 0) {
    const objectProperties: (
      | t.ObjectProperty
      | t.SpreadElement
      | t.ObjectMethod
    )[] = [];

    styleDeclarations.forEach((styleDeclaration: anyObject) => {
      if (styleDeclaration.type === NodeType.StyleDeclaration) {
        // StyleDeclaration
        if (styleDeclaration.property && styleDeclaration.value) {
          // Support following syntax:
          // <view style="color:red;flex-direction:column;"/> -> <div style={{color:'red',flexDirection:'column'}}/>
          // <view style="{{color}}:red;flex-direction:{{column}};"/> -> <div style={{[color+'']:'red',flexDirection:column}}/>
          // <view style="{{color}}_1:red;flex-direction:{{column}}_2;"/> -> <div style={{[color+'_1']:'red',flexDirection:column+'_2'}}/>
          let property = getCollectedProperty(
            (styleDeclaration.property || []).map((node: anyObject) => {
              if (node.type === NodeType.Mustache) {
                // Mustache
                const { identifiers, expression } = transformTextToExpression(
                  node.text
                );
                identifiers.forEach((i) => attrsCollector.add(i));
                return expression;
              } else if (node.type === NodeType.Text) {
                // Text justify-content -> justifyContent
                return t.stringLiteral(_.camelCase(node.text));
              } else if (node.type === NodeType.WhiteSpace) {
                // WhiteSpace
                return t.stringLiteral(" ");
              }

              return "";
            }),
            true
          );

          let value = getCollectedProperty(
            (styleDeclaration.value || []).map((node: anyObject) => {
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
              } else {
                debugger;
              }
              return "";
            }),
            false
          );

          objectProperties.push(
            t.objectProperty(property, value, t.isBinaryExpression(property))
          );
        } else if (styleDeclaration.property && styleDeclaration.property[0]) {
          // Support following syntax:
          // <view style=";{{customStyleString}};"/> -> <view style={{...this._styleStringToObject(customStyleString)}}/>
          const text = styleDeclaration.property[0].text;
          const { identifiers, expression } = transformTextToExpression(text);
          identifiers.forEach((i) => attrsCollector.add(i));
          objectProperties.push(
            t.spreadElement(
              t.callExpression(
                t.memberExpression(
                  t.thisExpression(),
                  t.identifier("_styleStringToObject")
                ),
                [expression]
              )
            )
          );
        }
      } else {
        // 当前 case 不支持；
        debugger;
      }
    });

    styleAttrs.push(
      t.jSXAttribute(
        t.jSXIdentifier("style"),
        t.jSXExpressionContainer(t.objectExpression(objectProperties))
      )
    );
  }
}

function collectClassAttrs(
  attr: anyObject,
  attrsCollector: Readonly<Set<string>>,
  classAttrs: t.JSXAttribute[]
) {
  const classNames = attr.children;
  if (classNames && classNames.length > 0) {
    const constValue: (t.StringLiteral | t.Identifier | t.Expression)[] = [];
    classNames.forEach((className: anyObject) => {
      if (className.type === NodeType.ClassName) {
        // className
        // <view class="class-name1 class-name2 {{cusClassName}} {{name}}_with_name"/> -> <View className={"class-name1" + " " + "class-name2" + " " + cusClassName + " " + name + "_with_name"}/>
        if (className.children && className.children.length > 0) {
          className.children.forEach((node: anyObject) => {
            if (node.type === NodeType.Text) {
              // Text
              constValue.push(t.stringLiteral(node.text));
            } else if (node.type === NodeType.Mustache) {
              // Mustache
              const { identifiers, expression } = transformTextToExpression(
                node.text
              );
              identifiers.forEach((i) => attrsCollector.add(i));
              constValue.push(expression);
            } else {
              // 当前 case 不支持；
              debugger;
            }
          });
        }
      } else if (className.type === NodeType.WhiteSpace) {
        // WhiteSpace
        constValue.push(t.stringLiteral(" "));
      } else {
        // 当前 case 不支持；
        debugger;
      }
    });

    const l = getCollectedProperty(constValue);
    let jSXAttributeValue:
      | t.JSXElement
      | t.StringLiteral
      | t.JSXExpressionContainer;

    if (t.isStringLiteral(l)) {
      // class="xxx" -> className="xxx"
      jSXAttributeValue = l;
    } else {
      // class="{{xxx}}_123" -> className={xxx+'_123'}
      jSXAttributeValue = t.jSXExpressionContainer(l);
    }

    classAttrs.push(
      t.jSXAttribute(t.jSXIdentifier("className"), jSXAttributeValue)
    );
  }
}

function collectDataAttrs(
  attr: anyObject,
  attrsCollector: Readonly<Set<string>>,
  dataAttrs: t.ObjectProperty[]
) {
  const name = attr.name;
  const propertyName = name.replace("data-", "");
  const dataVal = getCollectedProperty(
    (attr.children || []).map((node: anyObject) => {
      if (node.type === NodeType.Mustache) {
        // Mustache
        const { identifiers, expression } = transformTextToExpression(
          node.text
        );
        identifiers.forEach((i) => attrsCollector.add(i));
        return expression;
      } else if (node.type === NodeType.Text) {
        // Text
        // Support following syntax:
        // <text implicit-animation="false" /> -> <Text implicitAnimation={false} />
        if (node.text === "false" || node.text === "true") {
          return t.identifier(node.text);
        }
        return t.stringLiteral(node.text);
      } else if (node.type === NodeType.WhiteSpace) {
        // WhiteSpace
        return t.stringLiteral(" ");
      }
      debugger;
      return "";
    }),
    false
  );
  dataAttrs.push(t.objectProperty(t.identifier(propertyName), dataVal));
}

function collectCommonAttrs(
  attr: anyObject,
  attrsCollector: Readonly<Set<string>>,
  commonAttrs: t.JSXAttribute[]
) {
  // Support following syntax:
  // <text id="123" /> -> <Text id={"123"}/>
  // <text key="123_{{name}}">123_name</text> -> <Text key={"123_" + name}>123_name</Text>
  // <text clip-radius="true">clip-radius</text> -> <Text clipRadius={"true"}>clip-radius</Text>
  // <text clip-radius="{{true}}">clip-radius</text> -> <Text clipRadius={true}>clip-radius</Text>
  let attrKey = _.camelCase(attr.name);
  let attrValue = getCollectedProperty(
    (attr.children || []).map((node: anyObject) => {
      if (node.type === NodeType.Mustache) {
        // Mustache
        const { identifiers, expression } = transformTextToExpression(
          node.text
        );
        identifiers.forEach((i) => attrsCollector.add(i));
        return expression;
      } else if (node.type === NodeType.Text) {
        // Text
        // Support following syntax:
        // <text implicit-animation="false" /> -> <Text implicitAnimation={false} />
        if (node.text === "false" || node.text === "true") {
          return t.identifier(node.text);
        }
        return t.stringLiteral(node.text);
      } else if (node.type === NodeType.WhiteSpace) {
        // WhiteSpace
        return t.stringLiteral(" ");
      }
      debugger;
      return "";
    }),
    false
  );

  let jSXAttributeValue:
    | t.JSXElement
    | t.StringLiteral
    | t.JSXExpressionContainer;

  if (t.isStringLiteral(attrValue)) {
    // id="xxx" -> id="xxx"
    jSXAttributeValue = attrValue;
  } else if (attrValue) {
    // id="{{xxx}}_123" -> id={xxx+'_123'}
    jSXAttributeValue = t.jSXExpressionContainer(attrValue);
  } else {
    // x-scroll-> xScroll={true}
    jSXAttributeValue = t.jSXExpressionContainer(t.booleanLiteral(true));
  }

  commonAttrs.push(t.jSXAttribute(t.jSXIdentifier(attrKey), jSXAttributeValue));
}

function collectEventAttrs(
  attr: anyObject,
  attrsCollector: Set<string>,
  eventsCollector: EventsCollector,
  eventAttrs: t.JSXAttribute[],
  dataAttrs: t.ObjectProperty[]
) {
  const name = attr.name;
  let attrKey: string | undefined;
  let attrValue: t.Expression | undefined;

  // event attr
  const eventName = name.replace(/^bind/, "").replace(/^catch/, "");
  const reactEventName = lynxEventReMap[eventName]; // tap -> onClick
  if (reactEventName) {
    // Support following syntax:
    // <div bindtap="tapHandler"/> -> <div onClick={tapHandler}/>
    attrKey = reactEventName;
  } else {
    // Support following syntax:
    // <div bindchange="changeHandler"/> -> <div onChange={changeHandler}/>
    attrKey = _.camelCase(`on-${eventName}`);
  }

  if (attr.children.length === 1 && attr.children[0].type === NodeType.Text) {
    // Support following syntax:
    // <div bindchange="changeHandler"/> -> <div onChange={changeHandler(dataset)}/>
    const node = attr.children[0];
    // Mark: 事件这里的 text 表示一个标识符, 不支持动态模式
    attrsCollector.add(node.text);
    const withData = dataAttrs.length > 0;

    if (withData) {
      // <View onClick={this.onClick({a:b})}></View>
      attrValue = t.callExpression(
        t.memberExpression(t.thisExpression(), t.identifier(node.text)),
        [t.objectExpression(dataAttrs)]
      );
    } else {
      // <View onClick={this.onClick}></View>
      attrValue = t.memberExpression(
        t.thisExpression(),
        t.identifier(node.text)
      );
    }

    // 记录 事件处理函数名称 及 是否 catch；
    if (!eventsCollector.has(name)) {
      eventsCollector.set(node.text, {
        name: node.text,
        stopPropagation: Boolean(/^catch/.test(name)),
        withData: withData,
      });
    }
  } else {
    throw new Error(
      `请检查这个事件名称对应的 Handler：${name}，当前解析不支持这类写法 <text bindtouchstart="{{onTouchStart}}">msg</text>`
    );
  }

  if (attrKey && attrValue) {
    eventAttrs.push(
      t.jSXAttribute(
        t.jSXIdentifier(attrKey),
        t.jSXExpressionContainer(attrValue)
      )
    );
  }
}

export function genCommonElement(
  vnode: anyObject,
  attrsCollector: Set<string>,
  eventsCollector: EventsCollector,
  tagCollector: Set<string>
) {
  // Element
  let styleAttrs: t.JSXAttribute[] = [];
  let classAttrs: t.JSXAttribute[] = [];
  let commonAttrs: t.JSXAttribute[] = [];
  let eventAttrs: t.JSXAttribute[] = [];
  let dataAttrs: t.ObjectProperty[] = [];

  let attrs = vnode.attrs;
  if (attrs && attrs.length > 0) {
    // Collect element attributes
    attrs.forEach((attr: anyObject) => {
      switch (attr.type) {
        case NodeType.StyleAttribute:
          // StyleAttribute
          collectStyleAttrs(attr, attrsCollector, styleAttrs);
          break;
        case NodeType.ClassAttribute:
          // ClassAttribute
          collectClassAttrs(attr, attrsCollector, classAttrs);
          break;
        case NodeType.Attribute:
          // Attribute = normal + data
          const name = attr.name;
          if (/^data-/.test(name)) {
            collectDataAttrs(attr, attrsCollector, dataAttrs);
          } else if (/^bind/.test(name) || /^catch/.test(name)) {
            // do nothing
          } else {
            collectCommonAttrs(attr, attrsCollector, commonAttrs);
          }
          break;
        default:
          // 当前 case 不支持；
          debugger;
          break;
      }
    });

    // Event part processing
    attrs.forEach((attr: anyObject) => {
      if (
        attr.type === NodeType.Attribute &&
        (/^bind/.test(attr.name) || /^catch/.test(attr.name))
      ) {
        // Attribute = event
        collectEventAttrs(
          attr,
          attrsCollector,
          eventsCollector,
          eventAttrs,
          dataAttrs
        );
      }
    });
  }

  // Support following syntax:
  // <view id="xxx"> -> <View id="xxx">
  const tagName = _.upperFirst(_.camelCase(vnode.tag));
  tagCollector.add(tagName);
  return t.jSXElement(
    t.jSXOpeningElement(t.jSXIdentifier(tagName), [
      ...styleAttrs,
      ...classAttrs,
      ...commonAttrs,
      ...eventAttrs,
    ]),
    t.jSXClosingElement(t.jSXIdentifier(tagName)),
    []
  );
}
