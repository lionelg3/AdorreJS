import reg = require('./Registry');


export class EventBus {

    private static _instance: EventBus = null;

    private listeners: { [eventId: string]: [(data: JSON)=> void] ; } = {};

    constructor() {
        if (EventBus._instance) {
            throw new Error('Instantiate EventBus error.');
        }
        EventBus._instance = this;
    }

    public static getSharedEventBus(): EventBus {
        if (EventBus._instance === null) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    }

    on(eventId:string, callback:(data: JSON) => void) {
        if (!this.listeners[eventId]) {
            this.listeners[eventId] = [callback];
            return;
        }
        //this.listeners[eventId][this.listeners[eventId].length] = callback;
        this.listeners[eventId].push(callback);
    }

    fire(eventId:string, data?:JSON) {
        for (var x in this.listeners[eventId]) {
            var method = this.listeners[eventId][x];
            if (method) {
                setTimeout(method(data));
            }
        }
    }

    remove(eventId:string, callback:(data: JSON) => void) {
        if (this.listeners[eventId]) {
            var len: number = this.listeners[eventId].length;
            var newcallbacks: [(data: JSON)=> void] = [(data: JSON): void=> {}];
            for (var x = 0; x < len; x++) {
                var _callback: (data: JSON)=> void = this.listeners[eventId][x];
                if (_callback === callback) {
                } else {
                    newcallbacks.push(_callback);
                }
            }
            this.listeners[eventId] = newcallbacks;
        }
    }
}
