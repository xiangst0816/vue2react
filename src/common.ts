// ReactLynx 没有对应 ttml 的 block 标签，这里用 block 替换；
export const EmptyTag = "Block";

// @byted-lynx/react-components
export const ReactComponents = [
  "View",
  "Image",
  "Text",
  "Input",
  "WebcastInput",
  "WebcastInputView",
  "ScrollView",
  "Swiper",
  "SwiperItem",
  "Picker",
  "InlineImage",
  "FilterImage",
  "InlineText",
  "Textarea",
  "List",
  "Header",
  "Footer",
  "SVG",
];

export const LynxComponentCycle: Record<string, string | undefined> = {
  created: "_lynxComponentCreated", // 在 constructor 写明 this._lynxComponentCreated()
  attached: "_lynxComponentAttached", // 在 constructor 写明 this._lynxComponentAttached()，created 之后调用
  ready: "componentDidMount",
  detached: "componentWillUnmount",
  moved: undefined, // 没有对等实现
};

export const LynxCardCycle: Record<string, string | undefined> = {
  onLoad: "_lynxCardOnLoad", // 在 constructor 完成初始化 this._lynxComponentCreated()
  onShow: "_lynxCardOnShow", // 在 componentDidMount 进行事件监听
  onHide: "_lynxCardOnHide", // 在 componentDidMount 进行事件监听
  onReady: "componentDidMount",
  onDestroy: "componentWillUnmount",
  onDataChanged: "_lynxCardOnDataChanged", // 在 Card 的 componentDidMount 里面增加 diff 逻辑及触发逻辑
  onError: "componentDidCatch",
};
