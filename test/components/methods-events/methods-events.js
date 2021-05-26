Component({
  properties: {},
  data: {
    arr: [],
    obj: {},
    onTouchStart: "onTouchStart",
  },
  methods: {},
  bindtapHandler1(event) {
    console.log(event);
  },
  catchtaoHandler1(event) {
    console.log(event);
  },
  bindtapHandler2(event) {
    console.log(event);
  },
  catchtaoHandler2(event) {
    console.log(event);
  },
  ready() {
    this.triggerEvent("ready");
    this.triggerEvent("hello", { a: 1 });
    this.triggerEvent("world", [1, 2, 3]);
  },
});
