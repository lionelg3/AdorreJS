export declare class EventBus {
    private static _instance;
    private listeners;
    constructor();
    static getSharedEventBus(): EventBus;
    on(eventId: string, callback: (data: JSON) => void): void;
    fire(eventId: string, data?: JSON): void;
    remove(eventId: string, callback: (data: JSON) => void): void;
}
