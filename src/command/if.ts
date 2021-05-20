import {getCollectedProperty} from "../utils/generatorUtils";
import {anyObject, NodeType} from "../utils/types";
import * as t from "@babel/types";

export function wrapIfCommand (command:anyObject, element:t.JSXElement,attrsCollector: Readonly<Set<string>> ) {
    // Support following syntax:
    // <div tt:if="show"/> -> {show ? <div/> : null}
    const test = getCollectedProperty(
        (command.children || []).map((node: anyObject) => {
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
        })
    );

    return t.jSXExpressionContainer(
        t.conditionalExpression(test, element, t.nullLiteral())
    );
}