Component({
    properties: {
        mode: {
            type: String,
            value: '', // 通告栏模式，可选值为 closeable link
        },
        text: {
            type: String,
            value: '',
            observer: function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    this.init();
                }
            },
        },
        textColor: {
            type: String,
            value: '#FF7D00', // 通知文本颜色
        },
        bgColor: {
            type: String,
            value: '#fffbe8', // 滚动条背景
        },
        leftIcon: {
            type: String,
            value: '', // 左侧图标名称或图片链接
        },
        delay: {
            type: Number,
            value: 1000, // 动画延迟时间 (ms)
        },
        speed: {
            type: Number,
            value: 50, // 滚动速率 (px/s) 50
        },
        scrollable: {
            type: Boolean,
            value: false, // 是否开启滚动播放，内容长度溢出时默认开启
        },
        wrapable: {
            type: Boolean,
            value: false, // 是否开启文本换行，只在禁用滚动时生效
        },
        direction: {
            type: String,
            value: 'left', // 滚动方向，默认向左
        },
    },
    data: {
        name: 'arco-notice-bar',
        show: false,
        defaultColor: '#FF7D00',
        defaultBackgroundColor: '#fffbe8',
        left: 0,
        translateX: 0,
        transitionDuration: 0,
    },
    methods: {
        init() {
            this.setData({
                show: true,
            });
        },
        onClickCloseIcon(event) {
            if (this.data.mode === 'closeable') {
                this.setData({ show: false });
                this.triggerEvent('close', event);
            }
        },
        onClickLinkIcon(event) {
            if (this.data.mode === 'link') {
                this.triggerEvent('link', event);
            }
        },
    },
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWNlLWJhci5qcyIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL25vdGljZS1iYXIvbm90aWNlLWJhci50cyJdLCJzb3VyY2VzQ29udGVudCI6W251bGxdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLENBQUM7SUFDUixVQUFVLEVBQUU7UUFDVixJQUFJLEVBQUU7WUFDSixJQUFJLEVBQUUsTUFBTTtZQUNaLEtBQUssRUFBRSxFQUFFO1NBQ1Y7UUFDRCxJQUFJLEVBQUU7WUFDSixJQUFJLEVBQUUsTUFBTTtZQUNaLEtBQUssRUFBRSxFQUFFO1lBQ1QsUUFBUSxFQUFFLFVBQVUsTUFBYyxFQUFFLE1BQWM7Z0JBQ2hELElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtvQkFDckIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2lCQUNiO2FBQ0Y7U0FDRjtRQUNELFNBQVMsRUFBRTtZQUNULElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLFNBQVM7U0FDakI7UUFDRCxPQUFPLEVBQUU7WUFDUCxJQUFJLEVBQUUsTUFBTTtZQUNaLEtBQUssRUFBRSxTQUFTO1NBQ2pCO1FBQ0QsUUFBUSxFQUFFO1lBQ1IsSUFBSSxFQUFFLE1BQU07WUFDWixLQUFLLEVBQUUsRUFBRTtTQUNWO1FBQ0QsS0FBSyxFQUFFO1lBQ0wsSUFBSSxFQUFFLE1BQU07WUFDWixLQUFLLEVBQUUsSUFBSTtTQUNaO1FBQ0QsS0FBSyxFQUFFO1lBQ0wsSUFBSSxFQUFFLE1BQU07WUFDWixLQUFLLEVBQUUsRUFBRTtTQUNWO1FBQ0QsVUFBVSxFQUFFO1lBQ1YsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsS0FBSztTQUNiO1FBQ0QsUUFBUSxFQUFFO1lBQ1IsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUUsS0FBSztTQUNiO1FBQ0QsU0FBUyxFQUFFO1lBQ1QsSUFBSSxFQUFFLE1BQU07WUFDWixLQUFLLEVBQUUsTUFBTTtTQUNkO0tBQ0Y7SUFDRCxJQUFJLEVBQUU7UUFDSixJQUFJLEVBQUUsaUJBQWlCO1FBQ3ZCLElBQUksRUFBRSxLQUFLO1FBQ1gsWUFBWSxFQUFFLFNBQVM7UUFDdkIsc0JBQXNCLEVBQUUsU0FBUztRQUVqQyxJQUFJLEVBQUUsQ0FBQztRQUNQLFVBQVUsRUFBRSxDQUFDO1FBQ2Isa0JBQWtCLEVBQUUsQ0FBQztLQUN0QjtJQUVELE9BQU8sRUFBRTtRQUNQLElBQUk7WUFDRixJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUNYLElBQUksRUFBRSxJQUFJO2FBQ1gsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxnQkFBZ0IsQ0FBQyxLQUFLO1lBQ3BCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFO2dCQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ25DO1NBQ0Y7UUFDRCxlQUFlLENBQUMsS0FBSztZQUNuQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtnQkFDN0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDbEM7U0FDRjtLQUNGO0NBQ0YsQ0FBQyJ9
