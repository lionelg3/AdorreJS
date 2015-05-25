/// <reference path="../typings/ws/ws.d.ts" />
/// <reference path="Registry.d.ts" />
/// <reference path="JsonRpc.d.ts" />
/// <reference path="EventBus.d.ts" />
import ws = require('ws');
import reg = require('./Registry');
import jrpc = require('./JsonRpc');
export declare var DEBUG: boolean;
export declare module api {
    interface IBackendCallHandler {
        singleton(instanceName: string, classNames: any): any;
        stateless(instanceName: string, classNames: any): any;
        statefull(instanceName: string, classNames: any): any;
        getRegistry(instanceName: string): reg.api.IRPCRegistry;
        execute(client: WebSocket, instance: string, method: string, params: JSON, id: string): any;
        broadcastExecute(server: ws.Server, client: WebSocket, instance: string, method: string, params: JSON, id: string): any;
        sendResponseToOrigin(client: any, id: string, result: JSON): any;
        sendErrorToOrigin(client: any, id: string, code: number, message: string): any;
        useResponse(id: string, result: JSON): any;
        receiveClientError(rpc: jrpc.RPC): any;
    }
}
export declare class BackendCallHandler implements api.IBackendCallHandler {
    private _singleton;
    private _stateless;
    private _names;
    private _eventBus;
    private _pendingRequest;
    constructor();
    singleton(instanceName: string, classNames: any): void;
    stateless(instanceName: string, classNames: any): void;
    statefull(instanceName: string, classNames: any): void;
    getRegistry(instanceName: string): reg.api.IRPCRegistry;
    execute(client: WebSocket, instance: string, method: string, params: JSON, id: string): void;
    broadcastExecute(server: ws.Server, client: WebSocket, instance: string, method: string, params: JSON, id: string): void;
    sendResponseToOrigin(client: any, id: string, result: JSON): void;
    sendErrorToOrigin(client: any, id: string, code: number, message: string): void;
    useResponse(id: string, result: JSON): void;
    receiveClientError(rpc: jrpc.RPC): void;
    getClientResponseWithId(id: string): any;
    static log(...args: any[]): void;
}
