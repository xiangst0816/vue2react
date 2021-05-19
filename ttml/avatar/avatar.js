/* babel-plugin-inline-import './avatar-30.png' */
import debounce from "debounce";

// var defaultImage = "data:image/png;base64,xxxx";

Component({
  properties: {
    stringProps1: {
      type: String,
      value: "circle", // "circle" | 'square'
    },
    stringProps2: {
      type: String,
      value: "",
    },
    numberProps: {
      type: Number,
      value: 0,
    },
    ObjectProps: {
      type: Object,
      value: {},
    },
    arrayProps: {
      type: Array,
      value: [],
    },
    observerProps: {
      type: String,
      value: "",
      observer: function observer(newVal, oldVal) {
        if (newVal !== oldVal) {
          console.log(`imageStyle -> observer`);
        }
      },
    },
    custiomStyle1: {
      type: String,
      value: "",
    },
    custiomStyle2: {
      type: String,
      value: "",
    },
    cusClassName: {
      type: String,
      value: "",
    },
  },
  data: {
    name: "arco-avatar",
    index: 1,
    direction: 'direction',
    backgroundName: 'backgroundName',
    flexName: 'flex',
    hasError: false,
    // defaultImage,
  },
  methods: {
    onError() {
      this.setData({
        hasError: true,
        loaded: true,
      });

      for (
        var _len = arguments.length, args = new Array(_len), _key = 0;
        _key < _len;
        _key++
      ) {
        args[_key] = arguments[_key];
      }

      this.triggerEvent("error", ...args);
    },
    onLoad() {
      this.setData({
        loaded: true,
      });
    },
  },
  created() {
    console.log("ready");
  },
  attached() {
    console.log("attached");
  },
  detached() {
    console.log("detached");
  },
  moved() {
    console.log("moved");
  },
  error() {
    console.log("error");
  },
  ready() {
    console.log("ready");
    console.log(debounce);
  },
});
