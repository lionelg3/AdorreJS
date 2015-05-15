/// <reference path="UUIDGenerator.ts" />
/// <reference path="Registry.ts" />
/// <reference path="JsonRpc.ts" />
/// <reference path="EventBus.ts" />
/// <reference path="ClientCallHandler.ts" />
import uuid = require('./UUIDGenerator');
import reg = require('./Registry');
import jrpc = require('./JsonRpc');
import evt = require('./EventBus');
import handler = require('./ClientCallHandler');


export var DEBUG: boolean = false;

export module api {

    export interface IWSRpc {
        connect();
        close(): boolean;

        onOpen(callback: (event: Event) => void);
        onClose(callback: (event: CloseEvent) => void);
        onError(callback: (event: ErrorEvent) => void);
        onConnect(callback: () => void);

        doRequest(action: string, data: JSON, ...callbacks: ((data: JSON) => void)[]);
        onResponse(action: string, ...callbacks: ((data: JSON) => void)[]);

        call(about?: string): IWSRpcInvoke;
        on(about: string, ...callbacks: ((data: JSON) => void)[]);
    }

    export interface IWSRpcInvoke {
        method(method: string): IWSRpcMethod;
    }

    export interface IWSRpcMethod {
        withParams(params?: JSON): IWSRpcMethodRequest;
    }

    export interface IWSRpcMethodRequest {
        broadcast(): IWSRpcMethodRequest;
        now();
        then(...callbacks: ((data: JSON) => void)[]);
    }
}

export class WSRpcContext {
    ws:         WebSocket;
    id:         string;
    action:     string;
    method:     string;
    data:       JSON;
    broadcast:  boolean;
}

export class WSRpcLogging {
    static log(...args: any[]) {
        if (DEBUG) {
            console.debug.apply(console, args);
        }
    }
}

export class WSRpcInvoke implements api.IWSRpcInvoke {
    private _context: WSRpcContext;
    constructor(context: WSRpcContext) {
        this._context = context;
    }
    method(method: string): api.IWSRpcMethod {
        this._context.method = method;
        return new WSRpcMethod(this._context);
    }
}

export class WSRpcMethod implements api.IWSRpcMethod {
    private _context: WSRpcContext;
    constructor(context: WSRpcContext) {
        this._context = context;
    }
    withParams(params?: JSON): api.IWSRpcMethodRequest {
        this._context.data = params;
        return new WSRpcMethodRequest(this._context);
    }
}

export class WSRpcMethodRequest implements api.IWSRpcMethodRequest {
    private _context: WSRpcContext;
    constructor(context: WSRpcContext) {
        this._context = context;
    }
    broadcast(): WSRpcMethodRequest {
        this._context.broadcast = true;
        return this;
    }
    now() {
        var _rpc = jrpc.RPC.Request(this._context.id, this._context.method, this._context.data);
        if (this._context.ws) {
            WSRpcLogging.log('WSRpc', 'now', this._context.ws.url, JSON.stringify(_rpc));
            return this._context.ws.send(JSON.stringify(_rpc));
        } else {
            throw 'WS send error: connection may be closed';
        }
    }
    then(...callbacks:((data: JSON) => void)[]) {
        this._context.id =  this._context.method + ':' + uuid.UUIDGenerator.generateUUID();
        if (callbacks && callbacks.length > 0) {
            var eventBus: evt.EventBus = evt.EventBus.getSharedEventBus();
            for (var x = 0; x < callbacks.length; x++) {
                eventBus.on(this._context.id, callbacks[x]);
            }
        }
        this.now();
    }
}

export class WSRpc implements api.IWSRpc {

    private _ws: WebSocket;
    private _url: string;
    private _handler: handler.ClientCallHandler;

    private _onOpenCallback: (event: Event) => void;
    private _onCloseCallback: (event: CloseEvent) => void;
    private _onErrorCallback: (event: ErrorEvent) => void;
    private _onConnectCallback: () => void;

    constructor(url: string) {
        this._url = url;
        this._ws = null;
        this._handler = new handler.ClientCallHandler();
    }

    public connect() {
        WSRpcLogging.log('WSRpc', 'connecting ...', this._url);
        this._ws = new WebSocket(this._url, ['jsonrpc_2.0_over_websocket']);

        if (this._onConnectCallback) {
            setTimeout(this._onConnectCallback(), 0);
        }

        this._ws.onopen = (event: Event) => {
            WSRpcLogging.log('WSRpc', 'onOpen', this._url);
            if (this._onOpenCallback) {
                setTimeout(this._onOpenCallback(event), 0);
            }
        };

        this._ws.onclose = (event: CloseEvent) => {
            WSRpcLogging.log('WSRpc', 'onclose', this._url);
            if (this._onCloseCallback) {
                setTimeout(this._onCloseCallback(event), 0);
            }
        };

        this._ws.onmessage = (event: any) => {
            WSRpcLogging.log('WSRpc', 'onmessage', this._url, event.data);
            var rpc = JSON.parse(event.data);
            var _rpcMessage: jrpc.RPC = new jrpc.RPC(rpc);
            if (_rpcMessage.getId()) {
                evt.EventBus.getSharedEventBus().fire(rpc.id, (rpc.result) ? rpc.result : rpc.error);
            }
            if (_rpcMessage.isRequest()) {
                this._handler.execute(this._ws, _rpcMessage);
            }
        };

        this._ws.onerror = (event: ErrorEvent) => {
            WSRpcLogging.log('WSRpc', 'onerror', this._url, event);
            if (this._onErrorCallback) {
                setTimeout(this._onErrorCallback(event), 0);
            }
        };
    }

    ready(): boolean {
        return (this._ws != null);
    }

    close(): boolean {
        if (this._ws) {
            this._ws.close();
            this._ws = null;
            return true;
        }
        return false;
    }

    onOpen(callback:(event: Event) => void) {
        this._onOpenCallback = callback;
    }

    onClose(callback:(event: CloseEvent) => void) {
        this._onCloseCallback = callback;
    }

    onError(callback:(event: ErrorEvent) => void) {
        this._onErrorCallback = callback;
    }

    onConnect(callback:() => void) {
        this._onConnectCallback = callback;
    }

    call(about?: string): api.IWSRpcInvoke {
        var wsCtx: WSRpcContext = new WSRpcContext();
        wsCtx.ws = this._ws;
        wsCtx.id = about;
        return new WSRpcInvoke(wsCtx);
    }

    on(about: string, ...callbacks: ((data: JSON) => void)[]) {
        WSRpcLogging.log('Setting callback for', '"' + about + '"');
        if (callbacks && callbacks.length > 0) {
            var eventBus: evt.EventBus = evt.EventBus.getSharedEventBus();
            for (var x = 0; x < callbacks.length; x++) {
                eventBus.on(about, callbacks[x]);
            }
        }
    }

    doRequest(action: string, data: JSON, ...callbacks: ((data: JSON) => void)[]) {
        var _rpc = null;
        if (callbacks && callbacks.length > 0) {
            var _uuid: string =  action + ':' + uuid.UUIDGenerator.generateUUID();
            var eventBus: evt.EventBus = evt.EventBus.getSharedEventBus();
            for (var x = 0; x < callbacks.length; x++) {
                eventBus.on(_uuid, callbacks[x]);
            }
            _rpc = jrpc.RPC.Request(_uuid, action, data);
        } else {
            _rpc = jrpc.RPC.Request(action, action, data);
        }

        if (this._ws) {
            WSRpcLogging.log('WSRpc', 'send', this._ws.url, JSON.stringify(_rpc));
            return this._ws.send(JSON.stringify(_rpc));
        } else {
            throw 'WS send error: connection may be closed';
        }
    }

    onResponse(action: string, ...callbacks: ((data: JSON) => void)[]) {
        if (callbacks && callbacks.length > 0) {
            var eventBus: evt.EventBus = evt.EventBus.getSharedEventBus();
            for (var x = 0; x < callbacks.length; x++) {
                eventBus.on(action, callbacks[x]);
            }
        }
    }

    singleton(instanceName: string, classNames: any) {
        this._handler.singleton(instanceName, classNames);
    }

    stateless(instanceName: string, classNames: any) {
        this._handler.stateless(instanceName, classNames);
    }
}