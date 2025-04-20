import "./canvas-event.js";
import {game} from "./game.js";
import {Util} from "./util.js";
import {Class} from "./class.js";
import {Cevent} from "./canvas-event.js";
import {EventEmitter} from "./event-emitter.js";

const DEFAULT_PIECES = [3, 20, 50, 75, 100];
const DEFAULT_PIECES_TEXT = ["вельмі лёгка", "лёгка", "складана", "вельмі складана", "эксперт"];

function valueOptionTextSupplier(i) {
    return DEFAULT_PIECES_TEXT[i]
}

function getPixelRatio() {
    return window.devicePixelRatio || 1
}

(function (document, window, undefined) {
    "use strict";
    let ctx = Util.getContext(document.createElement("canvas")), testCtx = ctx, abs = Math.abs;
    let DEGREE = Math.PI / 180;
    let ctxFix = Util.getContext(document.createElement("canvas"));

    let ua = navigator.userAgent, isAndroid = ua.match(/android/i), isIOS = ua.match(/iphone|ipad|ipod/i),
        isWindowMobile = ua.match(/Windows Phone/i) || ua.match(/iemobile/i),
        isDesktop = !isAndroid && !isIOS && !isWindowMobile;
    let SNAP_DST = 20;

    function check_position(f1, f2) {
        if (f1.rotation % 360 || f2.rotation % 360 || f2.hide || f1.hide || f1.row != f2.row && f1.col != f2.col) {
            return
        }
        let diff_x = f1.tx - f2.tx, diff_y = f1.ty - f2.ty, diff_col = f1.col - f2.col, diff_row = f1.row - f2.row,
            w = f1.width, h = f1.height, s = f1.size;
        if ((diff_col == -1 && diff_x < 0 && abs(diff_x + w) < SNAP_DST || diff_col == 1 && diff_x >= 0 && abs(diff_x - w) < SNAP_DST) && (diff_y <= SNAP_DST && diff_y >= -SNAP_DST)) {
            return [f1.col > f2.col ? -abs(diff_x) + w : abs(diff_x) - w, f2.ty - f1.ty]
        } else if ((diff_row == -1 && diff_y < 0 && abs(diff_y + h) < SNAP_DST || diff_row == 1 && diff_y >= 0 && abs(diff_y - h) < SNAP_DST) && (diff_x <= SNAP_DST && diff_x >= -SNAP_DST)) {
            return [f2.tx - f1.tx, f1.row > f2.row ? -abs(diff_y) + h : abs(diff_y) - h]
        }
    }

    let Piece = Cevent.Shape.extend({
        type: "piece", init: function (x, y, img, width, height, edges, flat) {
            this.flat = flat;
            this._super(x, y);
            this.img = img;
            this.originalImg = img;
            this.size = Math.max(width, height);
            this.width = width;
            this.height = height;
            this.diagonal = ~~Math.sqrt(width * width + height * height);
            this.edges = edges;
            this.lastRotation = 0;
            let half_s = this.size / 2;
            this.tx = this.x + this.width / 2;
            this.ty = this.y + this.height / 2;
            this.x = -this.width / 2;
            this.y = -this.height / 2
        }, draw_path: function (ctx) {
            let s = this.size, fn, i = 0;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            for (; i < 4; i++) {
                fn = this.edges[i];
                s = i % 2 ? this.height : this.width;
                let w = i % 2 ? this.height : this.width;
                let h = i % 2 ? this.width : this.height;
                let x = i % 2 ? this.y : this.x;
                let y = i % 2 ? this.x : this.y;
                if (fn) {
                    let cx = this[fn](ctx, w, h, x, y)
                } else {
                    ctx.lineTo(x + s, y)
                }
                ctx.rotate(Math.PI / 2)
            }
            ctx.closePath()
        }, render: function (ox, oy) {
            ox = ox || this.ox || 0;
            oy = oy || this.oy || 0;
            this.originalTX = this.originalTX || this.tx;
            this.originalTY = this.originalTY || this.ty;
            let ctx = this.ctx || Util.getContext(document.createElement("canvas")), s = this.size + .5;
            ctxFix.canvas.width = ctx.canvas.width = s * 2;
            ctxFix.canvas.height = ctx.canvas.height = s * 2;
            ctxFix.save();
            ctx.save();
            this.applyStyle(ctx);
            ctxFix.lineWidth = .5;
            ctx.lineWidth = .5;
            ctx.translate(this.width, this.height);
            ctx.rotate(this.rotation * DEGREE);
            ctxFix.translate(this.width, this.height);
            ctxFix.rotate(this.rotation * DEGREE);
            this.draw_path(ctx);
            this.draw_path(ctxFix);
            ctx.fill();
            ctxFix.drawImage(this.originalImg, -this.originalTX - ox, -this.originalTY - oy);
            if (this.stroke) {
                ctxFix.globalCompositeOperation = "lighter";
                ctxFix.shadowOffsetY = 1.5;
                ctxFix.shadowOffsetX = 1.5;
                ctxFix.shadowBlur = 0;
                ctxFix.shadowColor = "rgba(255, 255, 255, .4)";
                ctxFix.lineWidth = 1.5;
                ctxFix.strokeStyle = "rgba(0, 0, 0, .4)";
                ctxFix.stroke();
                ctxFix.globalCompositeOperation = "darken";
                ctxFix.shadowBlur = 1;
                ctxFix.shadowOffsetY = -1;
                ctxFix.shadowOffsetX = -1;
                ctxFix.shadowBlur = 2;
                ctxFix.shadowColor = "rgba(0, 0, 0, .2)";
                ctxFix.lineWidth = 2;
                ctxFix.strokeStyle = "rgba(0, 0, 0, .4)";
                ctxFix.stroke();
                ctxFix.clip()
            }
            ctxFix.restore();
            ctx.restore();
            ctx.globalCompositeOperation = "source-in";
            if (ctx.globalCompositeOperation !== "source-in") {
                ctx.globalCompositeOperation = "source-atop"
            }
            ctx.drawImage(ctxFix.canvas, 0, 0);
            if (!this.ctx) this.tx += this.offset;
            this.img = ctx.canvas;
            this.ctx = ctx;
            this.ox = ox;
            this.oy = oy
        }, outside: function (ctx, w, h, cx, cy) {
            if (this.flat) return ctx.lineTo(cx + w, cy);
            ctx.lineTo(cx + w * .34, cy);
            ctx.bezierCurveTo(cx + w * .5, cy, cx + w * .4, cy + h * -.15, cx + w * .4, cy + h * -.15);
            ctx.bezierCurveTo(cx + w * .3, cy + h * -.3, cx + w * .5, cy + h * -.3, cx + w * .5, cy + h * -.3);
            ctx.bezierCurveTo(cx + w * .7, cy + h * -.3, cx + w * .6, cy + h * -.15, cx + w * .6, cy + h * -.15);
            ctx.bezierCurveTo(cx + w * .5, cy, cx + w * .65, cy, cx + w * .65, cy);
            ctx.lineTo(cx + w, cy)
        }, inside: function (ctx, w, h, cx, cy) {
            if (this.flat) return ctx.lineTo(cx + w, cy);
            ctx.lineTo(cx + w * .35, cy);
            ctx.bezierCurveTo(cx + w * .505, cy + .05, cx + w * .405, cy + h * .155, cx + w * .405, cy + h * .1505);
            ctx.bezierCurveTo(cx + w * .3, cy + h * .3, cx + w * .5, cy + h * .3, cx + w * .5, cy + h * .3);
            ctx.bezierCurveTo(cx + w * .7, cy + h * .29, cx + w * .6, cy + h * .15, cx + w * .6, cy + h * .15);
            ctx.bezierCurveTo(cx + w * .5, cy, cx + w * .65, cy, cx + w * .65, cy);
            ctx.lineTo(cx + w, cy)
        }, draw: function (ctx) {
            let x = this.x - this.width / 2 - .5;
            let y = this.y - this.height / 2 - .5;
            if (isDesktop) {
                this.setTransform(ctx);
                ctx.drawImage(this.img, x, y);
                return
            }
            if (this.rotation !== this.lastRotation) {
                this.render();
                this.lastRotation = this.rotation
            }
            ctx.drawImage(this.img, x + this.tx, y + this.ty)
        }, check: function (other) {
            let r;
            if (other.type === "piece") {
                r = check_position(this, other)
            } else {
                let i, l = other.pieces.length;
                for (i = 0; i < l; i++) {
                    if (r = check_position(this, other.pieces[i])) {
                        break
                    }
                }
            }
            if (r) {
                this.rmove(r[0], r[1])
            }
            return r
        }, hitTest: function (point) {
            if (this.hide) {
                return
            }
            this.setTransform(ctx);
            this.draw_path(ctx);
            return ctx.isPointInPath(point.x * getPixelRatio(), point.y * getPixelRatio())
        }
    }), Group = Cevent.Shape.extend({
        type: "group", init: function () {
            this.pieces = [];
            this._super(0, 0)
        }, draw: function (ctx) {
            if (this.hide) {
                return
            }
            let i, l = this.pieces.length;
            for (i = 0; i < l; i++) {
                this.pieces[i].draw(ctx)
            }
        }, hitTest: function (point) {
            let i, l = this.pieces.length;
            for (i = 0; i < l; i++) {
                if (this.pieces[i].hitTest(point)) {
                    return true
                }
            }
        }, check: function (other) {
            let i, l = this.pieces.length, r;
            if (other.type === "piece") {
                for (i = 0; i < l; i++) {
                    if (r = check_position(this.pieces[i], other)) {
                        this.rmove(r[0], r[1]);
                        return true
                    }
                }
            } else {
                let j, l2 = other.pieces.length;
                for (i = 0; i < l; i++) {
                    for (j = 0; j < l2; j++) {
                        if (r = check_position(this.pieces[i], other.pieces[j])) {
                            this.rmove(r[0], r[1]);
                            return true
                        }
                    }
                }
            }
        }, rmove: function (x, y) {
            let i, l = this.pieces.length;
            for (i = 0; i < l; i++) {
                this.pieces[i].rmove(x, y)
            }
            this.tx = this.minPieceX.tx;
            this.ty = this.minPieceY.ty
        }, add: function () {
            this.pieces = this.pieces.concat.apply(this.pieces, arguments);
            this.minPieceX = min(this.pieces, "tx");
            this.minPieceY = min(this.pieces, "ty");
            this.width = max(this.pieces, "tx").tx - this.minPieceX.tx;
            this.height = max(this.pieces, "ty").ty - this.minPieceY.ty;
            this.width += this.pieces[0].width;
            this.height += this.pieces[0].height;
            this.x = this.pieces[0].x;
            this.y = this.pieces[0].y;
            this.tx = this.minPieceX.tx;
            this.ty = this.minPieceY.ty
        }
    });

    function max(array, attr) {
        let max = array[0][attr];
        let index = 0;
        for (let i = 1; i < array.length; i++) {
            if (array[i][attr] > max) {
                max = array[i][attr];
                index = i
            }
        }
        return array[index]
    }

    function min(array, attr) {
        let min = array[0][attr];
        let index = 0;
        for (let i = 1; i < array.length; i++) {
            if (array[i][attr] < min) {
                min = array[i][attr];
                index = i
            }
        }
        return array[index]
    }

    Cevent.register("group", Group);
    Cevent.register("piece", Piece)
})(document, window);

export const jigsaw = (function (document, window, undefined) {
    "use strict";
    let IN = "inside", OUT = "outside", NONE = null, DEFAULT_IMAGE, EDGES = [IN, OUT], uuid = 0, default_opts = {
        spread: .7,
        offsetTop: window.innerHeight * 0.2,
        maxWidth: window.innerWidth * 0.8,
        maxHeight: window.innerHeight * 0.6,
        defaultImage: "images/0.jpg",
        piecesNumberTmpl: "%d Pieces",
        redirect: "",
        border: true,
        defaultPieces: 3,
        shuffled: false,
        rotatePieces: true,
        numberOfPieces: DEFAULT_PIECES,
        squarePieces: false
    }, TOOLBAR_HEIGHT = 45, pixelRatio = getPixelRatio();

    function random_edge() {
        return EDGES[Util.randint(2)]
    }

    let component = {};

    component.Jigsaw = Class.extend({
        init: function (opts) {
            let eventBus = new EventEmitter, self = this;
            this.container = document.body;
            this.opts = opts = Util.extend(opts || {}, default_opts);
            this.max_width = opts.maxWidth;
            this.max_height = opts.maxHeight;
            Util.$("redirect-form").action = opts.redirect;
            DEFAULT_IMAGE = opts.defaultImage;
            this.eventBus = eventBus;
            this.ce = new Cevent("canvas");
            this.ui = new component.UI(eventBus, opts.defaultPieces || 10);
            this.tmp_img = document.createElement("img");
            this.img = document.getElementById("image");
            this.ctx = Util.getContext(this.img);
            this.preview = document.getElementById("image-preview");
            this.previewCtx = Util.getContext(this.preview);
            this.parts = opts.defaultPieces || 10;
            this.tmp_img.onload = function () {
                self.original = this;
                self.draw_image(this);
                Util.calcPieces({
                    image: self.img,
                    template: self.opts.piecesNumberTmpl,
                    selected: self.parts,
                    options: self.opts.numberOfPieces
                }, valueOptionTextSupplier);
                self.render()
            };
            this.tmp_img.onerror = function () {
                if (DEFAULT_IMAGE) {
                    self.set_image(DEFAULT_IMAGE)
                }
            };
            jigsaw_events(this.ce, eventBus, this.opts.rotatePieces);
            eventBus.on(component.Events.JIGSAW_COMPLETE, function () {
                self.ui.stop_clock();
                if (opts.redirect) {
                    self.redirect()
                } else {
                    self.ui.show_time()
                }
            });
            if (opts.shuffled) {
                eventBus.on(component.Events.RENDER_FINISH, this.start_game.bind(this))
            }
            eventBus.on(component.Events.PARTS_NUMBER_CHANGED, this.set_parts.bind(this));
            eventBus.on(component.Events.RENDER_REQUEST, this.render.bind(this));
            eventBus.on(component.Events.START_GAME, this.start_game.bind(this));
            eventBus.on(component.Events.JIGSAW_SET_IMAGE, this.set_image.bind(this));
            Util.addEvent(window, "resize", this.resize.bind(this));
            this.resize();
            this.set_image()
        }, resize: function resizeView() {
            let canvas = this.ce.cv, maxWidth = this.width(), maxHeight = this.height() - TOOLBAR_HEIGHT;
            canvas.width = maxWidth * getPixelRatio();
            canvas.height = maxHeight * getPixelRatio();
            canvas.style.width = maxWidth + "px";
            canvas.style.height = maxHeight + "px";
            this.ce.redraw();
            if (Cevent.isTouchDevice) {
                Util.fullScreen()
            }
        }, redirect: function () {
            Util.$("t").value = this.ui.time();
            Util.$("p").value = this.parts;
            Util.$("redirect-form").submit()
        }, set_parts: function (n) {
            this.parts = n
        }, set_image: function (src) {
            this.ce.cv.className = "loading";
            this.tmp_img.src = src || DEFAULT_IMAGE
        }, width: function () {
            return this.container.offsetWidth
        }, height: function () {
            return this.container.offsetHeight
        }, draw_image: function (img, w, h) {
            let max_w = w || this.max_width * getPixelRatio(), max_h = h || this.max_height * getPixelRatio(), width,
                height, ctx = this.ctx;
            if (max_w > this.width() || max_h > this.height() - TOOLBAR_HEIGHT) {
                let ratio = Math.min(this.width() / max_w, (this.height() - TOOLBAR_HEIGHT) / max_h);
                max_w *= ratio;
                max_h *= ratio
            }
            if (img.width > max_w || img.height > max_h) {
                let rate = Math.min(max_w / img.width, max_h / img.height);
                width = ~~(img.width * rate) * getPixelRatio();
                height = ~~(img.height * rate) * getPixelRatio();
                ctx.canvas.width = width;
                ctx.canvas.height = height;
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height)
            } else {
                ctx.canvas.width = img.width * getPixelRatio();
                ctx.canvas.height = img.height * getPixelRatio();
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, ctx.canvas.width, ctx.canvas.height)
            }
        }, clear: function () {
            this.ce._shapes = []
        }, start_game: function () {
            let T = this.ce.getAll("piece");
            if (!this.__pieces) {
                return
            } else {
                this.ce._shapes = T = this.__pieces.slice(0)
            }
            this.ce.clear();
            let i, l = T.length, F, s = T[0].size, ratio = this.opts.spread, width = this.width() * getPixelRatio(),
                height = (this.height() - TOOLBAR_HEIGHT) * getPixelRatio(), w = width * ratio, h = height * ratio,
                padx = ~~((width - w) / 2), pady = ~~((height - h) / 2);
            for (i = 0; i < l; i++) {
                F = T[i];
                F.tx = Util.randint(w) + F.tx % 1 + padx;
                F.ty = Util.randint(h) + F.tx % 1 + pady;
                if (this.opts.rotatePieces) {
                    F.rotation = Util.randint(4) * 90
                }
            }
            if (this.opts.shuffled) {
                this.ce.cv.className = "";
                this.ui.init_clock()
            }
            Util.getElement("START_GAME").style.display = "none";
            this.ce.find("*").attr({hide: false});
            this.ce.shuffled = true;
            this.ce.redraw()
        }, render: function () {
            if (this.opts.shuffled) {
                this.ce.cv.className = "loading";
                this.ce.clear();
                this.ui.stop_clock()
            } else {
                this.ce.cv.className = ""
            }
            Util.getElement("START_GAME").style.display = null;
            this.ce.shuffled = false;
            let top, right, bottom, left, current_right = [], last_right = [], w = this.img.width, h = this.img.height,
                size = ~~Math.sqrt(w * h / this.parts), cols = ~~(w / size), rows = ~~(h / size), i = 0, j = 0,
                flag = ++uuid, offset;
            this.flag = flag;
            while (cols * rows < this.parts) {
                size--;
                cols = ~~(w / size);
                rows = ~~(h / size)
            }
            let width = ~~(w / cols);
            let height = ~~(h / rows);
            width = width % 2 ? width : width - 1;
            height = height % 2 ? height : height - 1;
            offset = ~~(this.width() / 2 * getPixelRatio() - width * cols / 2);
            this.clear();
            let ox = ~~((w - cols * width) / 2), oy = ~~((h - rows * height) / 2);
            ox = ox >= 0 ? ox : 0;
            oy = oy >= 0 ? oy : 0;
            this.preview.style.marginTop = this.opts.offsetTop + "px";
            this.preview.width = width * cols;
            this.preview.height = height * rows;
            this.preview.style.width = this.preview.width / getPixelRatio() + "px";
            this.preview.style.height = this.preview.height / getPixelRatio() + "px";
            this.previewCtx.globalAlpha = .3;
            this.previewCtx.drawImage(this.img, ox, oy, width * cols, height * rows, 0, 0, width * cols, height * rows);
            (function F() {
                if (i < cols && flag === this.flag) {
                    if (j < rows) {
                        top = j === 0 ? NONE : bottom === IN ? OUT : IN;
                        right = i === cols - 1 ? NONE : random_edge();
                        bottom = j === rows - 1 ? NONE : random_edge();
                        left = i === 0 ? 0 : last_right[j] === IN ? OUT : IN;
                        this.ce.piece(width * i, height * j + this.opts.offsetTop, window.G_vmlCanvasManager ? this.tmp_img : this.img, width, height, [top, right, bottom, left], this.opts.squarePieces).attr({
                            col: i,
                            row: j,
                            offset: offset,
                            stroke: this.opts.border ? "black" : ""
                        }).get(-1).render(ox, oy - this.opts.offsetTop);
                        if (!this.opts.shuffled) {
                            this.ce.redraw()
                        }
                        current_right.push(right);
                        j++
                    } else {
                        i++;
                        j = 0;
                        last_right = current_right;
                        current_right = []
                    }
                    setTimeout(F.bind(this), 20);
                } else if (this.flag === flag) {
                    this.__pieces = this.ce.get().slice(0);
                    this.ce.redraw();
                    this.eventBus.emit(component.Events.RENDER_FINISH)
                }
            }).bind(this)()
        }
    });

    component.Events = {
        PARTS_NUMBER_CHANGED: "PartsNumberChanged",
        RENDER_REQUEST: "RenderRequestEvent",
        RENDER_FINISH: "RenderFinishEvent",
        JIGSAW_RENDERED: "JigsawRenderedEvent",
        JIGSAW_SET_IMAGE: "JigsawSetImageEvent",
        START_GAME: "JigsawGameStartEvent",
        SHOW_PREVIEW: "JigsawShowPreview",
        JIGSAW_COMPLETE: "JigsawCompleteEvent",
        PIECES_CONNECTED: "PieceConnectedEvent",
        SHOW_SIDEBAR: "ShowSidebarEvent",
        HIDE_SIDEBAR: "HideSidebarEvent",
        ZOOM_IN: "JigsawZoomIn",
        ZOOM_OUT: "JigsawZoomOut",
    }

    component.GET = function() {
        if (location.query) {
            return
        }
        let parts = location.search.replace(/^[?]/, "").split("&"), i = 0, l = parts.length, GET = {};
        for (; i < l; i++) {
            if (!parts[i]) {
                continue
            }
            let part = parts[i].split("=");
            GET[unescape(part[0])] = unescape(part[1])
        }
        return GET
    }

    component.UI = Class.extend({
        init: function (eventBus, parts) {
            let self = this;
            this.eventBus = eventBus;
            this.clock = Util.getElement("clock");
            init_events(this, eventBus);
            eventBus.on(component.Events.START_GAME, this.init_clock.bind(this));
            eventBus.on(component.Events.SHOW_PREVIEW, this.show_preview.bind(this));
        }, stop_clock: function () {
            uuid++
        }, init_clock: function () {
            let self = this;
            this.ini = (new Date).getTime();
            this.uuid = uuid;
            (function F() {
                if (self.uuid === uuid) {
                    self.clock.innerHTML = self.time();
                    setTimeout(F, 1e3)
                }
            })()
        }, show_preview: function () {
            let canvas = Util.getElement("image-preview");
            canvas.className = canvas.className === "show" ? "hide" : "show";
            canvas.style.marginLeft = -(canvas.width / 2 / pixelRatio) + "px"
        }, show_time: function () {
            this.show_modal("congrat");
            Util.getElement("START_GAME").style.display = null;
            Util.getElement("time").innerHTML = this.clock.innerHTML;
        }, time: function () {
            let t = ~~(((new Date).getTime() - this.ini) / 1e3), s = t % 60, m = ~~(t / 60), h = ~~(m / 60);
            m %= 60;
            return (h > 9 ? h : "0" + h) + ":" + (m > 9 ? m : "0" + m % 60) + ":" + (s > 9 ? s : "0" + s)
        }, show_modal: function (id) {
            game.Modal.open(id)
        }
    });

    function jigsaw_events(ce, eventBus, rotate) {
        ce.drag("*", {
            start: function (c, e) {
                c.cv.style.cursor = "move";
                c.lastX *= getPixelRatio();
                c.lastY *= getPixelRatio();
                this.handleX = c.lastX - this.tx;
                this.handleY = c.lastY - this.ty
            }, move: function (c, e) {
                c.x *= getPixelRatio();
                c.y *= getPixelRatio();
                c.x += c.lastX - this.tx - this.handleX;
                c.y += c.lastY - this.ty - this.handleY
            }, afterMove: function (c, e) {
                let pwidth = ~~(this.width / 2);
                let pheight = ~~(this.height / 2);
                let posx = this.x + this.tx + pwidth;
                let posy = this.y + this.ty + pheight;
                let width = c.cv.width;
                let height = c.cv.height;
                if (this.rotation / 45 % 2) {
                    pwidth = this.diagonal / 2;
                    pheight = this.diagonal / 2
                }
                let x = 0;
                let y = 0;
                if (posx - pwidth < 0) {
                    x = posx - pwidth
                } else if (posx + pwidth > width) {
                    x = posx + pwidth - width
                }
                if (posy - pheight < 0) {
                    y = posy - pheight
                } else if (posy + pheight > height) {
                    y = posy + pheight - height
                }
                this.rmove(-x, -y)
            }, end: function (c, e) {
                c.cv.style.cursor = "default";
                if (!c.shuffled) {
                    return
                }
                let all = c.getAll("piece").concat(c.getAll("group")), i = 0, l = all.length, that = this;
                for (; i < l; i++) {
                    if (all[i] === this) {
                        continue
                    }
                    if (that.check(all[i])) {
                        c.remove(that);
                        c.remove(all[i]);
                        c._curHover = c.group().get(-1);
                        c._curHover.add(that.pieces || that, all[i].pieces || all[i]);
                        that = c._curHover;
                        c.focused = null
                    }
                }
                if (this !== that) {
                    eventBus.emit(component.Events.PIECES_CONNECTED)
                }
                if (!ce.getAll("piece").length && ce.getAll("group").length === 1 && ce.shuffled) {
                    ce.shuffled = false;
                    eventBus.emit(component.Events.JIGSAW_COMPLETE)
                }
                if (that.type === "group") {
                    c.remove(that);
                    c._shapes.unshift(that)
                }
            }
        }).focus("*", function (c, e) {
            c.remove(this);
            c._shapes.push(this)
        });
        Util.addEvent(ce.cv, "contextmenu", function (e) {
            if (rotate && ce.focused) {
                ce.focused.rotation = (ce.focused.rotation + 45) % 360;
                ce.redraw()
            }
            e.preventDefault()
        });
        if (!rotate) {
            return
        }
        ce.keydown("right", function () {
            if (this.focused) {
                this.focused.rotation = (this.focused.rotation + 45) % 360
            }
            return false
        }).keydown("left", function () {
            if (this.focused) {
                this.focused.rotation = (this.focused.rotation - 45) % 360
            }
            return false
        });
        ce.tap("*", function (c, e) {
            if (Cevent.isTouchDevice && ce.focused) {
                ce.focused.rotation = (ce.focused.rotation + 45) % 360;
                ce.redraw()
            }
        })
    }

    function init_events(self, eventBus) {
        function handleFiles(files) {
            let file = files[0];
            if (!file.type.match(/image.*/)) {
                Util.getElement("image-error").style.display = "block";
                return
            }
            let reader = new FileReader;
            reader.onloadend = function (e) {
                eventBus.emit(component.Events.JIGSAW_SET_IMAGE, this.result);
                close_lightbox()
            };
            reader.readAsDataURL(file)
        }

        if (window.FileReader && (new FileReader).onload === null) {
            Util.getElement("create-puzzle").classList.remove("hide");
            Util.$("image-input").change(function () {
                handleFiles(this.files)
            });
            if ("ondragenter" in window && "ondrop" in window) {
                Util.getElement("dnd").style.display = "block";
                document.addEventListener("dragenter", function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false
                }, false);
                document.addEventListener("dragover", function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false
                }, false);
                document.addEventListener("drop", function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    let dt = e.dataTransfer;
                    handleFiles(dt.files)
                }, false)
            }
        }

        function close_lightbox() {
            game.Modal.close();
            return false
        }

        function getSelectedValue(e){
            return e;
        }


        Array.from(document.querySelectorAll(".app-slider-selector")).forEach(function (el) {
            Util.addEvent(el, "click", function (e) {
                eventBus.emit(component.Events.JIGSAW_SET_IMAGE, e.target.src);
                eventBus.emit(component.Events.HIDE_SIDEBAR);
            });
        })

        Util.$("set-parts").change(function () {
            eventBus.emit(component.Events.PARTS_NUMBER_CHANGED, getSelectedValue(this.value));
            eventBus.emit(component.Events.RENDER_REQUEST);
        });

        Util.$("set-preview").change(function () {
            eventBus.emit(component.Events.SHOW_PREVIEW);
        });

        Cevent.addEventListener("game-options", "mousedown", function (e) {
            let target = e.target || e.srcElement;
            if (component.Events[target.id]) {
                e.preventDefault();
                eventBus.emit(component.Events[target.id])
            }
        })
    }

    EventEmitter.mixin(component.Jigsaw);

    return component;
    
})(document, window);
