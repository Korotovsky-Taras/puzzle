import {jigsaw} from "./jigsaw.js";

export const sidebar = (() => {
    const PANEL_ANIMATION_INIT = "app-slider-panel__animation-init";
    const PANEL_ROOT_EXPANDED_CLASS = "app-slider-panel__expanded";
    const PANEL_ROOT_OVERFLOW_CLASS = "app-slider-ov";
    const PANEL_EXPANDED_CLASS = "expanded";

    let panel = null;
    let buttons = [];
    let skipButtons = [];

    return {
        isReadyToUse() {
            return panel != null;
        },
        init: function (eventBus) {

            eventBus.on(jigsaw.Events.SHOW_SIDEBAR, function () {
                sidebar.show(true);
            });

            eventBus.on(jigsaw.Events.HIDE_SIDEBAR, function () {
                sidebar.show(false);
            });

            buttons = Array.from(document.querySelectorAll(".js-sidebar-open"));
            panel = document.querySelector(".app-slider-panel");

            if (!sidebar.isReadyToUse()) {
                throw new Error("SliderPanel: elements to init not found")
            }

            setTimeout(() => {
                panel.classList.add(PANEL_ANIMATION_INIT)
            }, 0);

            buttons.forEach(btn => {
                btn.addEventListener("click", () => sidebar.toggle());
            })


            skipButtons = [...buttons, Array.from(document.querySelectorAll(".js-sidebar-skip--event"))];

            document.addEventListener('click', (e) => {
                if (!panel.contains(e.target)
                    && skipButtons.every(btn => !btn.contains(e.target))
                    && panel.classList.contains(PANEL_EXPANDED_CLASS)) {
                    sidebar.toggle();
                }
            });
        },
        toggle: function () {
            sidebar.show(!panel.classList.contains(PANEL_EXPANDED_CLASS));
        },
        show: function (set) {

            console.log({panel})
            panel.classList.toggle(PANEL_EXPANDED_CLASS, set);
            buttons.forEach(btn => btn.classList.toggle("active", set));

            document.body.classList.toggle(PANEL_ROOT_EXPANDED_CLASS, set);

            if (matchMedia && matchMedia("(max-width: 767px)").matches) {
                document.documentElement.classList.toggle(PANEL_ROOT_OVERFLOW_CLASS, set);
            }
        }
    }
})();