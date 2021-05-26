Component({
  properties: {
    text1: {
      type: String,
      value: "", // 通知文本内容
      observer: function (newVal, oldVal) {
        console.log("hello", newVal, oldVal);
      },
    },
    text2: {
      type: String,
      value: "", // 通知文本内容
      observer(newVal = "", oldVal = "") {
        console.log("hello", newVal, oldVal);
      },
    },
    text3: {
      type: String,
      value: "", // 通知文本内容
      observer: (newVal, oldVal) => {
        console.log("hello", newVal, oldVal);
      },
    },
  },
  data: {},
  methods: {},
});
