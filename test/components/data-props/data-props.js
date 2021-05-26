Component({
  properties: {
    propsNull: {
      value: null,
    },
    propsUndefined: {
      value: undefined,
    },
    propsStr: {
      type: String,
      value: "",
    },
    propsStr1: String,
    propsStr2: [String, Number],
    propsNum: {
      type: Number,
      value: 0,
    },
    propsNum2: {
      type: Number,
      value: "",
    },
    propsBool: {
      type: Boolean,
      value: false,
    },
    propsArr: {
      type: Array,
      value: [],
    },
    propsArr1: Array,
    propsObj: {
      type: Object,
      value: {},
    },
    propsObj1: Object,
    propsObj2: {
      type: Object,
      value: null,
    },
  },
  data: {
    dataString: "",
    dataArray: [],
    dataObj: {},
    dataNumber: 0,
    dataBool: false,
    dataUndefined: undefined,
  },
  methods: {
    innerMethod() {
      const dataString = this.data.dataString;
      const dataString2 = this.data["dataString"];
      const dataArray = this.data.dataArray;
      const dataObj = this.data.dataObj;
      const dataNumber = this.data.dataNumber;
      const dataBool = this.data.dataBool;
      const dataUndefined = this.data.dataUndefined;
      const propsStr = this.properties.propsStr;
      const propsStr1 = this.properties.propsStr1;
      const propsStr2 = this.properties.propsStr2;
      const propsStr3 = this.properties["propsStr"];
      const propsStr4 = this.properties["propsS" + "tr"];
      const propsNum = this.properties.propsNum;
      const propsBool = this.properties.propsBool;
      const propsArr = this.properties.propsArr;
      const propsObj = this.properties.propsObj;
    },
    mistakeUsage1() {
      const propsStr = this.data.propsStr;
      const propsStr1 = this.data.propsStr1;
      const propsStr2 = this.data.propsStr2;
      const propsNum = this.data.propsNum;
      const propsBool = this.data.propsBool;
      const propsArr = this.data.propsArr;
      const propsObj = this.data.propsObj;
    },
    arrowFunction1: () => {},
    objectProperty1: function () {},
    fakeSetData1: function () {
      this.setData(
        {
          dataString: "123",
        },
        () => {
          const dataString = this.data.dataString;
        }
      );
    },
  },
  outerMethod() {
    const dataString = this.data.dataString;
    const dataArray = this.data.dataArray;
    const dataObj = this.data.dataObj;
    const dataNumber = this.data.dataNumber;
    const dataBool = this.data.dataBool;
    const dataUndefined = this.data.dataUndefined;
    const propsStr = this.properties.propsStr;
    const propsStr1 = this.properties.propsStr1;
    const propsStr2 = this.properties.propsStr2;
    const propsStr3 = this.properties["propsStr"];
    const propsStr4 = this.properties["propsS" + "tr"];
    const propsNum = this.properties.propsNum;
    const propsBool = this.properties.propsBool;
    const propsArr = this.properties.propsArr;
    const propsObj = this.properties.propsObj;
  },
  mistakeUsage2() {
    const propsStr = this.data.propsStr;
    const propsStr1 = this.data.propsStr1;
    const propsStr2 = this.data.propsStr2;
    const propsNum = this.data.propsNum;
    const propsBool = this.data.propsBool;
    const propsArr = this.data.propsArr;
    const propsObj = this.data.propsObj;
    const propsObj1 = this.data["propsObj"]; // 无法修正
    const propsObj3 = this.data["props" + "Obj"]; // 无法修正
  },
  arrowFunction2: () => {},
  objectProperty2: function () {},
  fakeSetData2: function () {
    this.setData(
      {
        dataString: "123",
      },
      () => {
        const dataString = this.data.dataString;
      }
    );
  },
});
