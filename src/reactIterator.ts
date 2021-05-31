import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import ReactVisitor from "./reactVisitor";
import { App, ITransformOptions } from "./utils/types";

export default function reactIterator(
  rast: t.Node,
  app: App,
  options: ITransformOptions
) {
  const visitor = new ReactVisitor(app, options);

  // 自定义组件点击透传
  // options.passTapEvent
  visitor.patchPassTapEvent();

  traverse(rast, {
    Program(path: NodePath<t.Program>) {
      visitor.genTopStatement(path); // no.3
      visitor.genImports(path, Boolean(options.hasStyle)); // no.1
      visitor.genComments(path); // no.0
      visitor.genStaticProps(path);
    },

    ClassBody(path: NodePath<t.ClassBody>) {
      visitor.genPropertyObserverMethods(path);
      visitor.genConfigProperty(path);
      visitor.genClassMethods(path);
      visitor.genRenderMethods(path);
    },
  });

  // lepus
  visitor.genLepusStatement(rast);

  // tag self close
  traverse(rast, {
    JSXElement(path: NodePath<t.JSXElement>) {
      visitor.genSelfClosingElement(path);
    },
  });

  return rast;
}
