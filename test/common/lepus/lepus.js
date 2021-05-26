var img = "data:image/png;base64,xx";

Component({
  properties: {
    shape: {
      type: String,
      value: "circle", // "circle" | 'square'
    },
    size: {
      type: String,
      value: "medium", // "huge" | "large" | "medium" | "small" | "minimum"
    },
    src: {
      type: String,
      value: "",
    },
    alt: {
      type: String,
      value: "",
    },
    animate: {
      type: Boolean,
      value: true,
    },
    avatarStyle: {
      type: String,
      value: "",
    },
    textStyle: {
      type: String,
      value: "",
    },
    imageStyle: {
      type: String,
      value: "",
    },
  },
  data: {
    name: "arco-avatar",
    loaded: false,
    hasError: false,
    defaultImage: img,
  },
  methods: {
    onError: function (...args) {
      this.setData({ hasError: true, loaded: true });
      this.triggerEvent("error", ...args);
    },
    onLoad: function () {
      this.setData({ loaded: true });
    },
  },
});
