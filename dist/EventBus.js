var EventBus = (function () {
    function EventBus() {
        this.listeners = {};
        if (EventBus._instance) {
            throw new Error('Instantiate EventBus error.');
        }
        EventBus._instance = this;
    }
    EventBus.getSharedEventBus = function () {
        if (EventBus._instance === null) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    };
    EventBus.prototype.on = function (eventId, callback) {
        if (!this.listeners[eventId]) {
            this.listeners[eventId] = [callback];
            return;
        }
        this.listeners[eventId].push(callback);
    };
    EventBus.prototype.fire = function (eventId, data) {
        for (var x in this.listeners[eventId]) {
            var method = this.listeners[eventId][x];
            if (method) {
                setTimeout(method(data));
            }
        }
    };
    EventBus.prototype.remove = function (eventId, callback) {
        if (this.listeners[eventId]) {
            var len = this.listeners[eventId].length;
            var newcallbacks = [function (data) {
            }];
            for (var x = 0; x < len; x++) {
                var _callback = this.listeners[eventId][x];
                if (_callback === callback) {
                }
                else {
                    newcallbacks.push(_callback);
                }
            }
            this.listeners[eventId] = newcallbacks;
        }
    };
    EventBus._instance = null;
    return EventBus;
})();
exports.EventBus = EventBus;

//# sourceMappingURL=EventBus.js.map