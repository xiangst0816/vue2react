// ReactLynx 没有对应 ttml 的 block 标签，这里用 view 替换；
export const EmptyTag = "view";

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
  created: "_lynxComponentCreated", // 需要在 constructor 写明 this._lynxComponentCreated()
  attached: "_lynxComponentAttached", // 需要在 constructor 写明 this._lynxComponentAttached()，created 之后调用
  ready: "componentDidMount",
  detached: "componentWillUnmount",
  moved: undefined, // 没有对等实现
};

export const LynxCardCycle: Record<string, string | undefined> = {
  // TODO: Card 部分 需要测试
  onLoad: "_lynxCardOnLoad", // 需要在 constructor 写明 this._lynxComponentCreated()
  onShow: "_lynxCardOnShow", // 需要在 componentDidMount -> this.getJSModule("GlobalEventEmitter").addListener("onShow", this._lynxCardOnShow)
  onHide: "_lynxCardOnHide", // 需要在 componentDidMount -> this.getJSModule("GlobalEventEmitter").addListener("onHide", this._lynxCardOnHide)
  onReady: "componentDidMount",
  onDestroy: "componentWillUnmount",
  onDataChanged: "_lynxCardOnDataChanged", // TODO 需要在 Card 的 componentDidMount 里面增加 diff 逻辑及触发逻辑
  onError: "componentDidCatch",
};
