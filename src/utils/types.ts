import * as t from '@babel/types';

export type anyObject = { [name: string]: any };
export interface Script {
  name: string;
  data: anyObject;
  props: anyObject;
  methods: anyObject;
  // computed: anyObject;
  imports: t.ImportDeclaration[];
  // TODO: lepus config
}

export interface Template {
  ast: t.JSXElement | undefined;
  attrsCollector: Readonly<Set<string>>;
  templateCollector: Readonly<Set<t.ClassMethod>>;
}

export interface App {
  template: Template;
  script: Script;
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