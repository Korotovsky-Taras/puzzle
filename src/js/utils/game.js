import {jigsaw} from "./jigsaw.js";
import {Cevent} from "./canvas-event.js";
import {sidebar} from "./sidebar.js";

export const game = (function() {

    let currentAudio = 0,
        support = window.Audio && (new Audio).canPlayType,
        TOTAL = 0;

    let $ = function (id) {
        return document.getElementById(id)
    };

    let $jsaw;
    let $modal;
    let $close;
    let $choice;
    let $overlay;

    function configure(opt) {

        $jsaw = new jigsaw.Jigsaw(opt);

        const sound = new Sound('click', 10);

        new sidebar.init($jsaw.eventBus);

        $jsaw.eventBus.on(jigsaw.Events.PIECES_CONNECTED, function () {
            sound.play();
        });

        if (jigsaw.GET["image"]) {
            $jsaw.set_image(jigsaw.GET["image"]);
        }
    }

    function init() {
        $modal = $("modal-window");
        $close = $("modal-window-close");
        $choice = $("modal-window-choice");
        $overlay = $("overlay");
        let event = Cevent.isTouchDevice ? "touchstart" : "click";
        Cevent.addEventListener($overlay, event, closeModal);
        Cevent.addEventListener($close, event, closeModal)
        Cevent.addEventListener($choice, event, openSidebar)
    }

    function showModal() {
        if (!$modal) {
            init()
        }
        $modal.className = "modal";
        $overlay.className = ""
    }

    function closeModal(e) {
        e && e.preventDefault();
        $modal.className = "modal hide";
        $overlay.className = "hide";
        return false
    }


    function openSidebar(e) {
        closeModal(e);
        console.log(111)
        $jsaw.eventBus.emit(jigsaw.Events.SHOW_SIDEBAR)
        return false
    }

    function Sound(file, n) {
        if (!support) {
            return;
        }
        let i;

        this.file = file;
        TOTAL = n;

        this.audio = [];

        for (i = 0; i < n; i++) {
            this.audio[i] = new Audio();
        }

        const load = function () {
            document.removeEventListener('touchstart', load);
            document.removeEventListener('mousedown', load);
            this.load();
        }.bind(this);

        document.addEventListener('touchstart', load);
        document.addEventListener('mousedown', load);
    }

    Sound.prototype.load = function () {
        if (!support) {
            return;
        }
        if (this._loaded) return;

        this._loaded = true;
        const ext = this.audio[0].canPlayType("audio/mp3") ? ".mp3" : ".wav";

        for (let i = 0; i < TOTAL; i++) {
            this.audio[i].src = this.file + ext;
            this.audio[i].volume = 0;
            this.audio[i].load();
        }
    }

    Sound.prototype.play = function () {
        if (!support) {
            return;
        }
        this.audio[currentAudio].volume = 1;
        this.audio[currentAudio].play();
        currentAudio = (currentAudio + 1) % TOTAL;
    }

    return {configure, Modal: {open: showModal, close: closeModal}};

})()