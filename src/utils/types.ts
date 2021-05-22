import * as t from "@babel/types";

export type anyObject = { [name: string]: any };

export interface Script {
  name: string;
  data: anyObject;
  props: anyObject;
  methods: anyObject;
  computed: anyObject;
  imports: t.ImportDeclaration[];
  variableDeclaration: t.VariableDeclaration[];
}

export interface Lepus {
  name: string; // _styleFn
  specifiers: string[][]; // [[local,exported]]
  path: string; // './test.lepus'
}

export interface Template {
  ast: t.JSXElement | undefined;
  attrsCollector: Readonly<Set<string>>;
  templateCollector: Readonly<Set<t.ClassMethod>>;
}

export interface App {
  template: Template;
  script: Script;
  lepus: Lepus[];
  config: Record<string, any>; // index.js
}

export interface Log {
  msg: string;
  type: string;
}

export enum NodeType {
  Root,
  Element,
  ContentElement,
  ImportElement,
  Comment,
  Text,
  Mustache,
  WhiteSpace,
  Attribute,
  ClassAttribute,
  StyleAttribute,
  ClassName,
  StyleDeclaration,
}
