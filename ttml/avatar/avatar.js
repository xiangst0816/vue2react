Component({
  properties: {
    str: String,
    num: Number,
    bool: Boolean,
    bool2: [Boolean],
    bool3: [Boolean, String],
    bool4: {
      type: Boolean,
    },
    bool5: {
      type: Boolean,
      value: false,
    },
  },
  data: { a: 1 },
  methods: {
    onError: function (...args) {
      this.properties.str;
      this.properties.num;
      this.properties.bool;
      this.data.a;
    },
    onError2(...args) {
      this.properties.str;
      this.properties.num;
      this.properties.bool;
      this.data.a;
    },
  },
  onError3: function (...args) {
    this.properties.str;
    this.properties.num;
    this.properties.bool;
    this.data.a;
  },
  onError4(...args) {
    this.properties.str;
    this.properties.num;
    this.properties.bool;
    this.data.a;
    XXX({
      created() {},
    });
  },
});
