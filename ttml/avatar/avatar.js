Component({
  data: {
    string: "string",
    boolean: true,
    number: 0,
    obj: { a: 1 },
    array: [1, 2, 3, 4],
  },
  handleEvent: function (e) {
    console.log("e:");
    console.log(e);
    const dataset = e.currentTarget.dataset;
    console.log(dataset);
  },
  catchEvent: function (e) {
    console.log("e:");
    console.log(e);
    const dataset = e.currentTarget.dataset;
    console.log(dataset);
  },
  onLoad: function () {
    console.log("hello world card loaded");
  },
});
