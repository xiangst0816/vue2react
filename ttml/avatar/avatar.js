Component({
  methods: {
    catchtapHandler: function () {
      // do nothing
    },
    dataHandler: function dataHandler() {
      // do nothing
      this.triggerEvent("change", {
        index: 1,
        item: this.props.tabs[index],
      });
    },
  },
});
