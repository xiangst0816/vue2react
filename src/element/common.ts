import { anyObject, NodeType } from "../utils/types";
import * as t from "@babel/types";
import { getCollectedProperty } from "../utils/generatorUtils";
import { lynxEventReMap } from "../utils/eventMap";
import _ from "lodash";

export function genCommonElement(
  vnode: anyObject,
  attrsCollector: Readonly<Set<string>>
) {
  // Element
  // 1 搜集元素属性；一种是表达式，一种是字面量
  let styleAttrs: t.JSXAttribute[] = [];
  let classAttrs: t.JSXAttribute[] = [];
  let commonAttrs: t.JSXAttribute[] = [];
  let eventAttrs: t.JSXAttribute[] = [];

  let attrs = vnode.attrs;
  if (attrs && attrs.length > 0) {
    attrs.forEach((attr: anyObject) => {
      switch (attr.type) {
        case NodeType.StyleAttribute:
          // StyleAttribute
          const styleDeclarations = attr.children;
          if (styleDeclarations && styleDeclarations.length > 0) {
            const objectProperties: (t.ObjectProperty | t.SpreadElement)[] = [];

            styleDeclarations.forEach((styleDeclaration: anyObject) => {
              if (styleDeclaration.type === NodeType.StyleDeclaration) {
                // StyleDeclaration
                if (styleDeclaration.property && styleDeclaration.value) {
                  // Support following syntax:
                  // <view style="color:red;flex-direction:column;"/> -> <div style={{color:'red',flexDirection:'column'}}/>
                  // <view style="{{color}}:red;flex-direction:{{column}};"/> -> <div style={{[color+'']:'red',flexDirection:column}}/>
                  // <view style="{{color}}_1:red;flex-direction:{{column}}_2;"/> -> <div style={{[color+'_1']:'red',flexDirection:column+'_2'}}/>
                  let property = getCollectedProperty(
                    styleDeclaration.property.map((node: anyObject) => {
                      if (node.type === NodeType.Mustache) {
                        // Mustache
                        attrsCollector.add(node.text);
                        return t.identifier(node.text);
                      } else if (node.type === NodeType.Text) {
                        // Text
                        return t.stringLiteral(node.text);
                      } else if (node.type === NodeType.WhiteSpace) {
                        // WhiteSpace
                        return t.stringLiteral(" ");
                      }

                      debugger;
                      return "";
                    }),
                    true
                  );

                  let value = getCollectedProperty(
                    styleDeclaration.value.map((node: anyObject) => {
                      if (node.type === NodeType.Mustache) {
                        // Mustache
                        attrsCollector.add(node.text);
                        return t.identifier(node.text);
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
                    t.objectProperty(
                      property,
                      value,
                      t.isBinaryExpression(property)
                    )
                  );
                } else if (
                  styleDeclaration.property &&
                  styleDeclaration.property[0]
                ) {
                  // Support following syntax:
                  // <view style=";{{customStyleString}};"/> -> <view style={{...this._styleStringToObject(customStyleString)}}/>
                  const text = styleDeclaration.property[0].text;
                  attrsCollector.add(text);
                  objectProperties.push(
                    t.spreadElement(
                      t.callExpression(
                        t.memberExpression(
                          t.thisExpression(),
                          t.identifier("_styleStringToObject")
                        ),
                        [t.identifier(text)]
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
                t.jSXExpressionContainer(
                  t.objectExpression(objectProperties as any)
                )
              )
            );
          }
          break;
        case NodeType.ClassAttribute:
          // ClassAttribute
          const classNames = attr.children;
          if (classNames && classNames.length > 0) {
            const constValue: (t.StringLiteral | t.Identifier)[] = [];
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
                      attrsCollector.add(node.text);
                      constValue.push(t.identifier(node.text));
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
          break;
        case NodeType.Attribute:
          // Attribute = normal + event
          let attrKey: string | undefined;
          let attrValue:
            | t.Literal
            | t.Identifier
            | t.BinaryExpression
            | undefined;
          const name = attr.name;

          if (/^bind/.test(name) || /^catch/.test(name)) {
            if (/^bind/.test(name)) {
              // event attr
              const reactEventName = lynxEventReMap[name];
              if (reactEventName) {
                // Support following syntax:
                // <div bindtap="tapHandler"/> -> <div onClick={tapHandler}/>
                attrKey = reactEventName;
              } else {
                // Support following syntax:
                // <div bindchange="changeHandler"/> -> <div onChange={changeHandler}/>
                attrKey = _.camelCase(name.replace("bind", "on-"));
              }

              if (
                attr.children.length === 1 &&
                attr.children[0].type === NodeType.Text
              ) {
                // Support following syntax:
                // <div bindchange="changeHandler"/> -> <div onChange={changeHandler}/>
                const node = attr.children[0];
                // Mark: 事件这里的 text 表示一个标识符
                attrsCollector.add(node.text);
                attrValue = t.identifier(node.text);
              } else {
                // TODO: 可能是下面的写法, 不支持
                // <text bindtouchstart="{{onTouchStart}}">bindtouchstart:onError</text>
                debugger;
              }
            } else if (/^catch/.test(name)) {
              // TODO: 事件 map 未填写
              // http://lynx.bytedance.net/docs/reactlynx/grammar/event
              debugger;
            }
            if (attrKey && attrValue) {
              eventAttrs.push(
                t.jSXAttribute(
                  t.jSXIdentifier(attrKey),
                  t.jSXExpressionContainer(attrValue)
                )
              );
            }
          } else {
            // Support following syntax:
            // <text id="123" /> -> <Text id={"123"}/>
            // <text key="123_{{name}}">123_name</text> -> <Text key={"123_" + name}>123_name</Text>
            // <text clip-radius="true">clip-radius</text> -> <Text clipRadius={"true"}>clip-radius</Text>
            // <text clip-radius="{{true}}">clip-radius</text> -> <Text clipRadius={true}>clip-radius</Text>
            attrKey = _.camelCase(attr.name);
            attrValue = getCollectedProperty(
              attr.children.map((node: anyObject) => {
                if (node.type === NodeType.Mustache) {
                  // Mustache
                  attrsCollector.add(node.text);
                  return t.identifier(node.text);
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
            } else {
              // id="{{xxx}}_123" -> id={xxx+'_123'}
              jSXAttributeValue = t.jSXExpressionContainer(attrValue);
            }

            commonAttrs.push(
              t.jSXAttribute(t.jSXIdentifier(attrKey), jSXAttributeValue)
            );
          }

          break;
        default:
          // 当前 case 不支持；
          debugger;
          break;
      }
    });
  }

  // Support following syntax:
  // <view> -> <View>
  const tagName = _.capitalize(vnode.tag);
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
