// [Literal('string'), Identifier(aa), BinaryExpression(left,right)]
// -> 'string' + aa + (left + right)
import * as t from "@babel/types";

export function getCollectedProperty(
    list: (t.Literal | t.Identifier | t.BinaryExpression)[],
    isProperty: boolean = false
): t.Literal | t.Identifier | t.BinaryExpression {
    let element: t.Literal | t.Identifier | t.BinaryExpression;

    // 变量的话，如果只有一个，作为属性需要加一个空字符串
    // [Identifier(aa)] -> '' + aa
    if (isProperty && list.length === 1 && t.isIdentifier(list[0])) {
        list.unshift(t.stringLiteral(""));
    }

    if (list.length === 1) {
        // [Literal('string')] -> Literal('string')
        element = list[0];
    } else {
        // [Literal('s1'),Literal('s2')] -> BinaryExpression('s1', 's2')
        let res: any = [...list];
        while (res.length > 1) {
            let left = res.shift();
            let right = res.shift();
            res.unshift(t.binaryExpression("+", left, right));
        }

        element = res[0];
    }
    return element;
}