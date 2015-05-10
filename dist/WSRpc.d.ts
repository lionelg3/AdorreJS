export declare var DEBUG: boolean;
export declare module api {
    interface IRPCRegistry {
        register(name: string, classname: any): any;
        invoke(name: string, method: string, params?: any): any;
        get(name: string): any;
    }
    interface IWSRpc {
        connect(): any;
        close(): boolean;
        onOpen(callback: (event: Event) => void): any;
        onClose(callback: (event: CloseEvent) => void): any;
        onError(callback: (event: ErrorEvent) => void): any;
        onConnect(callback: () => void): any;
        doRequest(action: string, data: JSON, ...callbacks: ((data: JSON) => void)[]): any;
        onResponse(action: string, ...callbacks: ((data: JSON) => void)[]): any;
        call(about?: string): IWSRpcInvoke;
        on(about: string, ...callbacks: ((data: JSON) => void)[]): any;
    }
    interface IWSRpcInvoke {
        method(method: string): IWSRpcMethod;
    }
    interface IWSRpcMethod {
        withParams(params?: JSON): IWSRpcMethodRequest;
    }
    interface IWSRpcMethodRequest {
        broadcast(): IWSRpcMethodRequest;
        now(): any;
        then(...callbacks: ((data: JSON) => void)[]): any;
    }
}
export declare class UUIDGenerator {
    static generateUUID(): string;
}
export declare class WSRpcClientCallHandler {
    private _singleton;
    private _stateless;
    private _names;
    constructor();
    singleton(instanceName: string, classNames: any): void;
    stateless(instanceName: string, classNames: any): void;
    getRegistry(instanceName: string): api.IRPCRegistry;
    execute(client: WebSocket, rpc: RpcMessage): void;
    rpcInvoke(client: WebSocket, instance: string, method: string, params: JSON, id: string): void;
}
export declare class EventBus {
    private static _instance;
    private listeners;
    constructor();
    static getSharedEventBus(): EventBus;
    on(eventId: string, callback: (data: JSON) => void): void;
    fire(eventId: string, data?: JSON): void;
    remove(eventId: string, callback: (data: JSON) => void): void;
}
export declare class RpcMessage {
    _code: number;
    _message: string;
    _id: string;
    _broadcast: boolean;
    _namedMethod: string;
    _namedInstance: string;
    _namedAction: string;
    _result: JSON;
    _params: JSON;
    constructor(rpc: any);
    isError(): boolean;
    isRequest(): boolean;
    isResponse(): boolean;
    getCode(): number;
    getErrorMessage(): string;
    getResult(): JSON;
    getParams(): JSON;
    isBroadcast(): boolean;
    getMethod(): string;
    getInstance(): string;
    getAction(): string;
    getId(): string;
}
export declare class ObjectRegistry implements api.IRPCRegistry {
    private _objects;
    constructor();
    register(name: string, className: any): void;
    invoke(name: string, method: string, params?: any): any;
    get(name: string): any;
}
export declare class ClassRegistry implements api.IRPCRegistry {
    private _classNames;
    constructor();
    register(name: string, className: any): void;
    invoke(name: string, method: string, params?: any): any;
    get(name: string): any;
}
export declare class KeyRegistry implements api.IRPCRegistry {
    private _key;
    private _classRegistry;
    private _objects;
    constructor(key: string, registry: ClassRegistry);
    register(name: string, className: any): void;
    invoke(name: string, method: string, params?: any): any;
    key(): string;
    get(name: string): any;
}
export declare class RPC {
    static VERSION: string;
    static PARSE_ERROR: number;
    static INVALID_REQUEST: number;
    static METHOD_NOT_FOUND: number;
    static INVALID_PARAMS: number;
    static INTERNAL_ERROR: number;
    static Response(id: string, result?: JSON): {
        'jsonrpc': string;
        'result': JSON;
        'id': string;
    };
    static Request(id: string, method: string, data?: JSON): {
        'jsonrpc': string;
        'method': string;
        'params': JSON;
        'id': string;
    };
    static Error(id: string, code: number, message: string): {
        'jsonrpc': string;
        'error': {
            'code': number;
            'message': string;
        };
        'id': string;
    };
}
export declare class WSRpcContext {
    ws: WebSocket;
    id: string;
    action: string;
    method: string;
    data: JSON;
    broadcast: boolean;
}
export declare class WSRpcLogging {
    static log(...args: any[]): void;
}
export declare class WSRpcInvoke implements api.IWSRpcInvoke {
    private _context;
    constructor(context: WSRpcContext);
    method(method: string): api.IWSRpcMethod;
}
export declare class WSRpcMethod implements api.IWSRpcMethod {
    private _context;
    constructor(context: WSRpcContext);
    withParams(params?: JSON): api.IWSRpcMethodRequest;
}
export declare class WSRpcMethodRequest implements api.IWSRpcMethodRequest {
    private _context;
    constructor(context: WSRpcContext);
    broadcast(): WSRpcMethodRequest;
    now(): void;
    then(...callbacks: ((data: JSON) => void)[]): void;
}
export declare class WSRpc implements api.IWSRpc {
    private _ws;
    private _url;
    private _handler;
    private _onOpenCallback;
    private _onCloseCallback;
    private _onErrorCallback;
    private _onConnectCallback;
    constructor(url: string);
    connect(): void;
    close(): boolean;
    onOpen(callback: (event: Event) => void): void;
    onClose(callback: (event: CloseEvent) => void): void;
    onError(callback: (event: ErrorEvent) => void): void;
    onConnect(callback: () => void): void;
    call(about?: string): api.IWSRpcInvoke;
    on(about: string, ...callbacks: ((data: JSON) => void)[]): void;
    doRequest(action: string, data: JSON, ...callbacks: ((data: JSON) => void)[]): void;
    onResponse(action: string, ...callbacks: ((data: JSON) => void)[]): void;
    singleton(instanceName: string, classNames: any): void;
    stateless(instanceName: string, classNames: any): void;
}
