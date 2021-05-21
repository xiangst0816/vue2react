function deepClone(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepClone);
  } else if (obj && typeof obj === "object") {
    const cloned = {};
    const keys = Object.keys(obj);
    for (let i = 0, l = keys.length; i < l; i++) {
      const key = keys[i];
      cloned[key] = deepClone(obj[key]);
    }
    return cloned;
  } else {
    return obj;
  }
}

const FrameTime = 16;
Component({
  properties: {
    text: {
      type: String,
      value: "",
      observer: function (newVal, oldVal) {
        if (newVal !== oldVal) {
          this.init();
        }
      },
    },
    direction: {
      type: String,
      value: "left", // "left" | "right" | "up" | "down"
    },
    // scroll 首尾相接
    scrollHeadToTail: {
      type: Boolean,
      value: false,
    },
    textStyle: {
      type: String,
      value: "", // 文本 样式
    },
    wrapStyle: {
      type: String,
      value: "", // warp 样式
    },
    bgStyle: {
      type: String,
      value: "", // 背景 样式
    },
    hspace: {
      type: Number,
      value: 16, //
    },
    delay: {
      type: Number,
      value: 1000, // 动画延迟时间 (ms)
    },
    speed: {
      type: Number,
      value: 50, // 滚动速率 (px/s) 50
    },
    list: {
      type: Array,
      value: [1,2,3], // 滚动速率 (px/s) 50
    },
    two: {
      type: [Array,Boolean],
    },
  },
  data: {
    name: "arco-marquee",
    show: false,
    defaultColor: "#ed6a0c",
    defaultBackgroundColor: "#fffbe8",
    list: [],
    _id: 100,
    _contentWidth: 0,
    _wrapWidth: 0,
    _transitionTimer: 0,
    _wrapHeight: 0,
    _contentHeight: 0,
  },
  created() {
    this.data._id = 100;
  },
  methods: {
    _getEventId(e) {
      return (
        (e?.dataset?.id ||
          e?.target?.dataset?.id ||
          e?.currentTarget?.dataset?.id ||
          "") >> 0
      );
    },
    _handleLeftRightTransitionEnd(current, list) {
      const contentWidth = this.data._contentWidth;
      const wrapWidth = this.data._wrapWidth;
      const direction = this.data.direction || "left";
      const speed = this.data.speed || 0;
      const scrollHeadToTail = !!this.data.scrollHeadToTail;
      const distance = scrollHeadToTail
        ? list.length * contentWidth
        : contentWidth + wrapWidth;
      const during = ((distance / speed) * 1000) >> 0; // ms
      let left = 0;
      if (direction === "left") {
        left = scrollHeadToTail ? (list.length - 1) * contentWidth : wrapWidth;
        current.animateStyle = `left:${left}px;`;
      } else if (direction === "right") {
        left = scrollHeadToTail
          ? wrapWidth - contentWidth * list.length
          : -contentWidth;
        current.animateStyle = `left:${left}px;`;
      }
      // 进行动画
      this.setData({ list }, () => {
        current.animateStyle = this._getAnimateStyle({
          direction,
          left: left,
          delay: 0,
          during: during,
          distance: distance,
        });
        this.setData({ list });
      });
    },
    _handleUpDownTransitionEnd() {
      if (this.data._transitionTimer) {
        clearTimeout(this.data._transitionTimer);
      }
      // debounce 整体更新
      this.data._transitionTimer = setTimeout(() => {
        const list = deepClone(this.data.list || []);
        this.data._transitionTimer = undefined;
        const direction = this.data.direction || "up";
        const speed = this.data.speed || 0;
        const delay = this.data.delay || 0;
        const wrapHeight = this.data._wrapHeight;
        const contentHeight = this.data._contentHeight;
        const during = ((wrapHeight / speed) * 1000) >> 0; // ms
        list.forEach((current) => {
          let totalStep = 0;
          if (current.top === 0 || current.bottom === 0) {
            totalStep = Math.round(contentHeight / wrapHeight);
          } else {
            totalStep = Math.round(contentHeight / wrapHeight) * 2;
          }
          if (current.step < totalStep) {
            // 进行单步动画
            current.step += 1;
            const animateStyleInfo = {
              direction,
              delay: delay,
              during: during,
              distance: wrapHeight * current.step,
            };
            if (direction === "up") {
              animateStyleInfo.top = current.top;
            } else {
              animateStyleInfo.bottom = current.bottom;
            }
            current.animateStyle = this._getAnimateStyle(animateStyleInfo);
          } else {
            // 复位
            current.step = 0;
            if (direction === "up") {
              current.top = contentHeight;
              current.animateStyle = `top:${current.top}px;`;
            } else {
              current.bottom = contentHeight;
              current.animateStyle = `bottom:${current.bottom}px;`;
            }
          }
        });
        this.setData({ list }, () => {
          // 激活第一步动画
          list.forEach((current) => {
            if (current.step === 0) {
              const distance = wrapHeight;
              const animateStyleInfo = {
                direction: current.direction,
                delay: delay,
                during: during,
                distance: distance,
              };
              if (direction === "up") {
                animateStyleInfo.top = current.top;
              } else {
                animateStyleInfo.bottom = current.bottom;
              }
              current.animateStyle = this._getAnimateStyle(animateStyleInfo);
              current.step += 1;
            }
          });
          this.setData({ list });
        });
      }, FrameTime * 5);
    },
    _getAnimateStyle(options) {
      let distance = options.distance || 0;
      const during = options.during || 1000;
      const delay = options.delay || 0;
      const direction = options.direction || "left";
      if (direction === "left" || direction === "right") {
        const left = options.left || 0;
        if (direction === "left") {
          distance = distance * -1;
        }
        return `;left:${left}px;transform:translateX(${distance}px);transition:transform ${during}ms linear ${delay}ms;`;
      } else {
        if (direction === "up") {
          distance = distance * -1;
          const top = options.top || 0;
          return `;top:${top}px;transform:translateY(${distance}px);transition:transform ${during}ms linear ${delay}ms;`;
        } else {
          const bottom = options.bottom || 0;
          return `;bottom:${bottom}px;transform:translateY(${distance}px);transition:transform ${during}ms linear ${delay}ms;`;
        }
      }
    },
    _moveUpDown() {
      const contentHeight = this.data._contentHeight;
      const wrapHeight = this.data._wrapHeight;
      const direction = this.data.direction || "up";
      const text = this.data.text || "";
      const speed = this.data.speed || 0;
      const delay = this.data.delay || 0;
      const list = [];
      if (direction === "up") {
        [0, 1].forEach((i) => {
          const top = contentHeight * i;
          list.push({
            direction,
            id: ++this.data._id,
            index: i,
            top: top,
            text: text,
            animateStyle: `top:${top}px;`,
            step: 0,
          });
        });
        this.setData({ list }, () => {
          // 进行动画
          list.forEach((i) => {
            const distance = wrapHeight;
            const during = ((wrapHeight / speed) * 1000) >> 0; // ms
            i.animateStyle = this._getAnimateStyle({
              direction: i.direction,
              top: i.top,
              delay: delay,
              during: during,
              distance: distance,
            });
            i.step += 1;
          });
          this.setData({ show: true, list });
        });
      } else if (direction === "down") {
        [0, 1].forEach((i) => {
          const bottom = contentHeight * i;
          list.push({
            direction,
            id: ++this.data._id,
            index: i,
            bottom: bottom,
            text: text,
            animateStyle: `bottom:${bottom}px;`,
            step: 0,
          });
        });
        this.setData({ list }, () => {
          // 进行动画
          list.forEach((i) => {
            const distance = wrapHeight;
            const during = ((wrapHeight / speed) * 1000) >> 0; // ms
            i.animateStyle = this._getAnimateStyle({
              direction: i.direction,
              bottom: i.bottom,
              delay: delay,
              during: during,
              distance: distance,
            });
            i.step += 1;
          });
          this.setData({ show: true, list });
        });
      }
    },
    _moveLeftRight() {
      const contentWidth = this.data._contentWidth;
      const wrapWidth = this.data._wrapWidth;
      const speed = this.data.speed || 0;
      const delay = this.data.delay || 0;
      const text = this.data.text || "";
      const scrollHeadToTail = !!this.data.scrollHeadToTail;
      const direction = this.data.direction || "left";
      const list = [];
      const count = Math.ceil(wrapWidth / contentWidth) + 1;
      let offset = 0;
      if (direction === "left") {
        offset = 0;
      } else if (direction === "right") {
        offset = wrapWidth - contentWidth;
      }
      if (scrollHeadToTail) {
        for (let i = 0; count > i; i++) {
          const left =
            offset + contentWidth * i * (direction === "left" ? 1 : -1);
          list.push({
            direction,
            id: ++this.data._id,
            index: i,
            left,
            text: text,
            animateStyle: `left:${left}px;`,
          });
        }
      } else {
        const item = {
          direction,
          id: ++this.data._id,
          index: 0,
          text: this.data.text,
        };
        const left = offset;
        item.left = left;
        item.animateStyle = `left:${left}px;`;
        list.push(item);
      }
      this.setData({ list }, () => {
        // 进行动画
        list.forEach((i, index) => {
          const distance = contentWidth * (index + 1);
          const during = ((distance / speed) * 1000) >> 0; // ms
          i.animateStyle = this._getAnimateStyle({
            direction: i.direction,
            left: i.left,
            delay: delay,
            during: during,
            distance: distance,
          });
        });
        this.setData({ show: true, list });
      });
    },
    handleTransitionEnd(e) {
      const id = this._getEventId(e);
      if (!id) return;
      const list = deepClone(this.data.list || []);
      const current = list.find((i) => i.id === id);
      if (!current) return;
      const direction = this.data.direction || "left";
      if (direction === "left" || direction === "right") {
        this._handleLeftRightTransitionEnd(current, list);
      } else {
        this._handleUpDownTransitionEnd();
      }
    },
    getRect(id) {
      return new Promise((resolve, reject) => {
        const videoRef = this.getNodeRef(id);
        videoRef.invoke({
          method: "boundingClientRect",
          success: function (res) {
            resolve(res);
          },
          fail: function (res) {
            reject(res);
          },
        });
      });
    },
    init() {
      if (this.data._transitionTimer) clearTimeout(this.data._transitionTimer);
      this.setData({ list: [], show: false }, () => {
        Promise.all([this.getRect("#content"), this.getRect("#wrap")])
          .then((rects) => {
            const [contentRect, wrapRect] = rects;
            if (
              contentRect == null ||
              wrapRect == null ||
              !contentRect.width ||
              !wrapRect.width
            ) {
              return;
            }
            this.data._contentWidth = contentRect.width >> 0 || 0;
            this.data._contentHeight = contentRect.height >> 0 || 0;
            this.data._wrapWidth = wrapRect.width >> 0 || 0;
            this.data._wrapHeight = wrapRect.height >> 0 || 0;
            const direction = this.data.direction || "left";
            if (direction === "left" || direction === "right") {
              this._moveLeftRight();
            } else {
              this._moveUpDown();
            }
          })
          .catch((e) => {
            console.log(
              'ERROR -> 无法获取元素尺寸，安卓端适配需要在配置 `xx.json` 中配置这个参数 `"flatten": false`，配置方式可以参考 demo！'
            );
            console.log(e);
          });
      });
    },
  },
});
