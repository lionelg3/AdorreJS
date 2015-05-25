/// <reference path="UUIDGenerator.d.ts" />
/// <reference path="Registry.d.ts" />
/// <reference path="JsonRpc.d.ts" />
/// <reference path="EventBus.d.ts" />
/// <reference path="FrontendCallHandler.d.ts" />
export declare var DEBUG: boolean;
export declare module api {
    interface IWSRpcFrontend {
        link(ws: WebSocket): any;
        call(name: string, method: string, then?: (data?: JSON) => void, otherwise?: (data: JSON) => void): IWSRpcCall;
        singleton(instanceName: string, classNames: any): any;
        stateless(instanceName: string, classNames: any): any;
    }
    interface IWSRpcCall {
        fire(data?: JSON): any;
        broadcast(data?: JSON): any;
    }
}
export declare class WSRpcFrontend implements api.IWSRpcFrontend {
    private _ws;
    private _handler;
    constructor();
    link(ws: WebSocket): void;
    call(name: string, method: string, then?: (data?: JSON) => void, otherwise?: (data: JSON) => void): api.IWSRpcCall;
    singleton(instanceName: string, classNames: any): void;
    stateless(instanceName: string, classNames: any): void;
    static log(...args: any[]): void;
}
