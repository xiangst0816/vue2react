Component({
  properties: {
    b: {
      type: String,
      value: "",
    },
  },
  data: {
    a: 1,
  },
  methods: {},

  created() {
    this.a = this.data.a;
    this.b = this.properties.b;
  },
  attached() {
    this.a = this.data.a;
    this.b = this.properties.b;
  },
  ready() {
    this.a = this.data.a;
    this.b = this.properties.b;
  },
  detached() {
    this.a = this.data.a;
    this.b = this.properties.b;
  },
  // moved(){},
});
