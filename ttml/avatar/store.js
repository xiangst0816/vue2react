/* babel-plugin-inline-import './avatar-30.png' */
import {debounce} from "debounce";
var defaultImage = "data:image/png;base64,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";
Component({
    properties: {
        shape: {
            type: String,
            value: 'circle' // "circle" | 'square'

        },
        size: {
            type: String,
            value: 'medium' // "huge" | "large" | "medium" | "small" | "minimum"

        },
        src: {
            type: String,
            value: ''
        },
        alt: {
            type: String,
            value: ''
        },
        animate: {
            type: Boolean,
            value: true
        },
        avatarStyle: {
            type: String,
            value: ''
        },
        textStyle: {
            type: String,
            value: ''
        },
        imageStyle: {
            type: String,
            value: ''
        }
    },
    data: {
        name: 'arco-avatar',
        loaded: false,
        hasError: false,
        defaultImage
    },
    methods: {
        onError () {
            this.setData({
                hasError: true,
                loaded: true
            });

            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            this.triggerEvent('error', ...args);
        },
        onLoad: function onLoad() {
            this.setData({
                loaded: true
            });
        }
    }
});