export declare module lg3x {
    var DEBUG: boolean;
    module api {
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
    class UUIDGenerator {
        static generateUUID(): string;
    }
    class EventBus {
        private static _instance;
        private listeners;
        constructor();
        static getSharedEventBus(): EventBus;
        on(eventId: string, callback: (data: JSON) => void): void;
        fire(eventId: string, data?: JSON): void;
        remove(eventId: string, callback: (data: JSON) => void): void;
    }
    class RPCParser {
        _code: number;
        _message: string;
        _id: string;
        _broadcast: boolean;
        _namedMethod: string;
        _namedInstance: string;
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
        getNamedInstance(): string;
        getId(): string;
    }
    class RPCRegistry {
        private _instances;
        constructor();
        add(name: string, instance: Object): void;
        invoke(namedInstance: string, namedMethod: string, params?: any): any;
    }
    class RPC {
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
    class WSRpcContext {
        ws: WebSocket;
        id: string;
        action: string;
        method: string;
        data: JSON;
        broadcast: boolean;
    }
    class WSRpcLogging {
        static log(...args: any[]): void;
    }
    class WSRpcInvoke implements api.IWSRpcInvoke {
        private _context;
        constructor(context: WSRpcContext);
        method(method: string): api.IWSRpcMethod;
    }
    class WSRpcMethod implements api.IWSRpcMethod {
        private _context;
        constructor(context: WSRpcContext);
        withParams(params?: JSON): api.IWSRpcMethodRequest;
    }
    class WSRpcMethodRequest implements api.IWSRpcMethodRequest {
        private _context;
        constructor(context: WSRpcContext);
        broadcast(): WSRpcMethodRequest;
        now(): void;
        then(...callbacks: ((data: JSON) => void)[]): void;
    }
    class WSRpc implements api.IWSRpc {
        private _ws;
        private _url;
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
    }
}
