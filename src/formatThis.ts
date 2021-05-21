import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import { Script } from "./utils/types";

/*
  Support following syntax:
  this.name -> this.state.name/this.props.name
  this.name = 'tom' -> this.setState({name: 'jerry'})
  const { name } = this -> const { name } = this.state
  ...
*/

function getThisIdentify(script: Script, key: string) {
  if (script.data[key]) {
    return t.identifier("state");
  } else if (script.props[key]) {
    return t.identifier("props");
  }
  return null;
}

export default function formatThisExpression(
  path: NodePath<t.ObjectMethod>,
  script: Script
): t.BlockStatement {
  let block: t.Statement[] = [];
  path.traverse(
    {
      enter(subpath: NodePath<any>) {
        subpath.traverse(
          {
            ThisExpression(this: any, subpath: NodePath<t.ThisExpression>) {
              // here is -> this.xxx
              if (subpath.parent && t.isMemberExpression(subpath.parent)) {
                if (
                  t.isIdentifier(subpath.parent.property) &&
                  subpath.parent.property.name
                ) {
                  const thisPropertyName = subpath.parent.property.name;
                  if (thisPropertyName === "setData") {
                    // Support following syntax:
                    // this.setData({name:'Tom'}) -> this.setState({name: 'Tom'})
                    subpath.parent.property.name = "setState";
                  } else if (
                    subpath.parent.property.name === "data" ||
                    subpath.parent.property.name === "properties"
                  ) {
                    let replacedName: string;
                    if (subpath.parent.property.name === "data") {
                      replacedName = "state";
                    } else {
                      replacedName = "props";
                    }
                    // Support following syntax:
                    // Fix the problem of mixing usage of data and properties
                    // this.data.name -> this.state.name/this.props.name
                    // this.properties.name -> this.state.name/this.props.name
                    if (
                      t.isMemberExpression(subpath.parentPath.parent) &&
                      t.isIdentifier(subpath.parentPath.parent.property) &&
                      subpath.parentPath.parent.property.name
                    ) {
                      let name: string =
                        subpath.parentPath.parent.property.name;
                      if (script.data.hasOwnProperty(name)) {
                        replacedName = "state";
                      } else if (script.props.hasOwnProperty(name)) {
                        replacedName = "props";
                      }
                    }

                    // Support following syntax:
                    // 这里不支持 data/properties 推断
                    // const { speed } = this.properties -> const { speed } = this.props;
                    // const { name } = this.data -> const { name } = this.state;
                    subpath.parent.property.name = replacedName;
                  }
                }
              }

              subpath.stop();
            },
          },
          { script }
        );
        if (subpath.parentPath.parent === path.node) {
          block.push(subpath.node);
        }
      },
    },
    { script, block }
  );

  return t.blockStatement(block);
}
