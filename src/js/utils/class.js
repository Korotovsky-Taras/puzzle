"use strict";

let initializing = false;

// Основной конструктор Class
function Class() {}

// Метод extend для создания подклассов
Class.extend = function(prop) {
    const _super = this.prototype;
    let prototype;

    // Создаем прототип нового класса
    initializing = true;
    prototype = new this(); // Используем new this() вместо new this
    initializing = false;

    // Копируем свойства из prop в прототип
    for (let name in prop) {
        if (typeof prop[name] === "function" && typeof _super[name] === "function") {
            // Если метод переопределяет метод родителя, используем _super
            prototype[name] = (function(name, fn) {
                return function() {
                    const tmp = this._super;
                    this._super = _super[name];
                    const ret = fn.apply(this, arguments);
                    this._super = tmp;
                    return ret;
                };
            })(name, prop[name]);
        } else {
            // Иначе просто копируем свойство
            prototype[name] = prop[name];
        }
    }

    // Конструктор нового класса
    function Class() {
        if (this instanceof Class) {
            // Если это вызов через new, вызываем init (если он есть)
            if (!initializing && this.init) {
                this.init.apply(this, arguments);
            }
        } else {
            // Если вызвано без new, возвращаем новый экземпляр
            return new Class(...arguments);
        }
    }

    // Настройка прототипа и конструктора
    Class.prototype = prototype;
    Class.prototype.constructor = Class;

    // Копируем метод extend в новый класс
    Class.extend = this.extend;

    return Class;
};

// Экспорт Class как модуля
export { Class };