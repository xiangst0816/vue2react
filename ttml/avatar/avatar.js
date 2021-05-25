Component({
    properties: {
        content: {
            type: String,
            value: ''
        },
        type: {
            type: String,
            value: 'secondary' // "primary" | "secondary" | "dashed" | "text" | "outline"

        },
        status: {
            type: String,
            value: 'default' // "default" | "warning" | "danger" | "success"

        },
        size: {
            type: String,
            value: 'default' // "default" | "mini" | "small" | "large"

        },
        shape: {
            type: String,
            value: 'square' // "circle" | "round" | "square"

        },
        iconOnly: {
            type: Boolean,
            value: false
        },
        long: {
            type: Boolean,
            value: false
        },
        loading: {
            type: Boolean,
            value: false
        },
        loadingOnly: {
            type: Boolean,
            value: false
        },
        disabled: {
            type: Boolean,
            value: false
        },
        loadingFixedWidth: {
            type: Boolean,
            value: false
        },
        btnStyle: {
            type: String,
            value: ''
        },
        btnActiveStyle: {
            type: String,
            value: ''
        },
        btnDisabledStyle: {
            type: String,
            value: ''
        },
        textStyle: {
            type: String,
            value: ''
        },
        textActiveStyle: {
            type: String,
            value: ''
        },
        textDisabledStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        name: 'arco-btn',
        active: false // 外部使用

    },
    methods: {
        onTouchStart: function onTouchStart() {
            if (this.data.loading || this.data.disabled) return;
            setTimeout(() => {
                this.setData({
                    active: true
                });
            }, 20);
        },
        onTouchEnd: function onTouchEnd() {
            if (this.data.loading || this.data.disabled) return;
            setTimeout(() => {
                this.setData({
                    active: false
                });
            }, 70);
        },
        onCatchTap: function onCatchTap() {// do nothing
        }
    }
});