Component({
  properties: {},
  data: {},
  ppppppp: 123,
  methods: {},
  pageLifetimes: {
    show() {
      console.log(`pageLifetimes show`);
    },
    hide() {
      console.log(`pageLifetimes hide`);
    },
  },
  created() {
    console.log(`created`);
  },
  attached() {
    console.log(`attached`);
  },
  ready() {
    console.log(`ready`);
  },
  detached() {
    console.log(`detached`);
  },
  // moved(){},
});
