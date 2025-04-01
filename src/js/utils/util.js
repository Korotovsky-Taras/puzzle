import {Class} from "./class.js"

function getLvlText(parts, opt) {
    if (parts < 10) {
        return "легко"
    }
    return "";
}

export const Util = (function (window) {
    "use strict";

    const Util = {
        randint: function (n) {
            return ~~(Math.random() * n)
        }
    };

    if (!("bind" in Function)) {
        Function.prototype.bind = function (context) {
            let self = this;
            return function () {
                return self.apply(context, arguments)
            }
        }
    }

    let $ = Class.extend({
        init: function (id) {
            this.elem = document.getElementById(id)
        }
    });

    let addEvent = function (elem, event, callback) {
        if (document.addEventListener) {
            return function (elem, type, callback) {
                elem.addEventListener(type, callback, false)
            }
        } else {
            return function (elem, type, callback) {
                elem.attachEvent("on" + type, function (e) {
                    e = e || event;
                    e.preventDefault = e.preventDefault || function () {
                        this.returnValue = false
                    };
                    e.stopPropagation = e.stopPropagation || function () {
                        this.cancelBubble = true
                    };
                    return callback.call(e.target || e.srcElement, e)
                })
            }
        }
    }();
    let events = ("mousemove mouseover mouseout mousedown mouseup click touchstart " + "dblclick focus blur submit change").split(" ");
    for (let i = 0; i < events.length; i++) {
        let event = events[i];
        $.prototype[event] = function (event) {
            return function (selector, fn) {
                if (typeof selector == "function") {
                    addEvent(this.elem, event, selector)
                } else {
                    addEvent(this.elem, event, function (e) {
                        let elem = e.target || e.srcElement;
                        if (elem.tagName.toLowerCase() === selector) {
                            e.stopPropagation();
                            fn.call(elem, e)
                        }
                    }, false)
                }
            }
        }(event)
    }
    Util.fullScreen = function () {
        if (document.documentElement.scrollHeight < window.outerHeight / window.devicePixelRatio) {
            document.body.style.height = window.outerHeight / window.devicePixelRatio + 1 + "px";
            setTimeout(function () {
                window.scrollTo(1, 1)
            }, 0)
        } else {
            window.scrollTo(1, 1)
        }
    };
    Util.getContext = function (canvas) {
        if (!canvas.getContext && window.G_vmlCanvasManager) {
            G_vmlCanvasManager.initElement(canvas)
        }
        return canvas.getContext("2d")
    };
    Util.extend = function (orig, obj) {
        let attr;
        for (attr in obj) {
            if (obj.hasOwnProperty(attr) && !(attr in orig)) {
                orig[attr] = obj[attr]
            }
        }
        return orig
    };

    Util.calcPieces = function (options, optionTextSupplier) {
        let w = options.image.width, h = options.image.height, select = document.getElementById("set-parts"),
            selectedIndex = 0, option, size, cols, rows, parts;
        select.innerHTML = "";
        for (let i = 0; i < options.options.length; i += 1) {
            let size = ~~Math.sqrt(w * h / options.options[i]), cols = ~~(w / size), rows = ~~(h / size);
            while (cols * rows < options.options[i]) {
                size--;
                cols = ~~(w / size);
                rows = ~~(h / size)
            }
            if (parts !== cols * rows) {
                parts = cols * rows;
                option = document.createElement("option");
                option.value = options.options[i];
                option.innerHTML = optionTextSupplier(i);
                select.appendChild(option);
                if (options.options[i] === options.selected) option.selected = true
            }
        }
    };

    Util.addEvent = addEvent;

    Util.$ = function () {
        let _ = $();
        return function (id) {
            _.elem = document.getElementById(id);
            return _
        }
    }();

    Util.getElement = function (id) {
        return document.getElementById(id)
    };

    Util.ajax = function (options) {
        let xmlhttp = new XMLHttpRequest;
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState === XMLHttpRequest.DONE) {
                if (xmlhttp.status === 200) {
                    if (options.success) {
                        options.success(xmlhttp.responseText)
                    }
                } else {
                    if (options.error) {
                        options.error()
                    }
                }
            }
        };
        xmlhttp.open("GET", options.url, true);
        xmlhttp.send()
    }

    window.Util = window.Util || Util;

    return Util;

})(window)