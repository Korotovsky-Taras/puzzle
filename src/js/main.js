import "./utils/es6-promise.js";

import {game} from "./utils/game.js";

window.addEventListener("DOMContentLoaded",  function () {
    game.configure({
        defaultImage: "./images/0.jpg",
        piecesNumberTmpl: "%d Pieces",
        defaultPieces: 3,
    });
})


document.addEventListener("ontouchmove", function stayStill(e) {
    e.preventDefault();
})