/// <reference path="../typings/ws/ws.d.ts" />
/// <reference path="Registry.d.ts" />
/// <reference path="JsonRpc.d.ts" />
/// <reference path="EventBus.d.ts" />
/// <reference path="BackendCallHandler.d.ts" />
import ws = require('ws');
export declare var DEBUG: boolean;
export declare module api {
    interface IWSRpcBackend {
        link(server: ws.Server): any;
        singleton(instanceName: string, classNames: any): any;
        stateless(instanceName: string, classNames: any): any;
        statefull(instanceName: string, classNames: any): any;
    }
}
export declare class WSRpcBackend implements api.IWSRpcBackend {
    private _server;
    private _handler;
    constructor();
    link(server: ws.Server): void;
    singleton(instanceName: string, classNames: any): void;
    stateless(instanceName: string, classNames: any): void;
    statefull(instanceName: string, classNames: any): void;
    private _onClientMessage(client, data, flags);
    static log(...args: any[]): void;
}
