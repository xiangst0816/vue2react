Component({
  data: {
    a: 1,
    d: 1,
  },
  properties: {
    text: {
      type: String,
      value: "default world！",
      // observe () {};
      // observe:function(){};
      // observe:()=>{};
      observer: function (newVal, oldVal) {
        console.log(`props text change: ${oldVal} -> ${newVal}`);
        const b = this.data.a;
        const c = this.properties.text;
        this.xxx(b, c, this.data.d);
      }
    },
  },
  created(){}, // Function  否  在组件创建时使用；此时不能调用 setData
  attached(){}, // Function  否  在 created 之后执行
  // ready(){}, // Function  否  已支持，在 attached 之后执行
  // moved(){}, // Function  否  在组件实例被移动到节点树另一个位置时执行
  // detached(){}, // Function  否  组件移除时候触发
  xxx() {},
});
