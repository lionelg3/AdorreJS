export var DEBUG: boolean = false;

export module api {

    export interface IRPCRegistry {
        register(name: string, classname: any);
        invoke(name: string, method: string, params?: any): any;
        get(name: string): any;
    }

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

export class UUIDGenerator {

    public static generateUUID(): string {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
}

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

export class RPCParser {
    _code: number;
    _message: string;
    _id: string;
    _broadcast: boolean;
    _namedMethod: string;
    _namedInstance: string;
    _result: JSON;
    _params: JSON;

    constructor(rpc) {
        if (rpc.jsonrpc !== '2.0') {
            throw 'RPC Method Parser Error';
        }
        this._id = rpc.id;
        this._broadcast = false;
        if (rpc.error) {
            this._code = rpc.error.code;
            this._message = rpc.error.message;
        }
        else if (rpc.result) {
            this._result = rpc.result;
        }
        else {
            this._params = rpc.params;
            var t = rpc.method.split('.');
            this._namedMethod = t[t.length - 1];
            this._namedInstance = null;
            if (t[0].split('}')[0] === '{broadcast') {
                this._broadcast = true;
                this._namedInstance = t[0].split('}')[1];
            } else {
                this._namedInstance = t[0];
            }
        }
    }

    isError(): boolean {
        return (this._code !== undefined);
    }

    isRequest(): boolean {
        return (this._namedMethod !== undefined);
    }

    isResponse(): boolean {
        return (this._result != undefined);
    }

    getCode(): number {
        return this._code;
    }

    getErrorMessage(): string {
        return this._message;
    }

    getResult(): JSON {
        return this._result;
    }

    getParams(): JSON {
        return this._params;
    }

    isBroadcast(): boolean {
        return this._broadcast;
    }

    getMethod(): string {
        return this._namedMethod;
    }

    getNamedInstance(): string {
        return this._namedInstance;
    }

    getId(): string {
        return this._id;
    }
}

export class ObjectRegistry implements api.IRPCRegistry {
    private _objects: { [name: string]: Object } = {};
    constructor() {}

    register(name: string, className: any) {
        this._objects[name] = new className();
    }

    invoke(name: string, method: string, params?: any): any {
        try {
            var instance = this._objects[name];
            return instance[method](params);
        } catch (err) {
            var msg: string = 'ObjectRegistry invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    }

    get(name: string): any {
        return this._objects[name];
    }
}

export class ClassRegistry implements api.IRPCRegistry {
    private _classNames: { [name: string]: any } = {};
    constructor() {}

    register(name: string, className: any) {
        this._classNames[name] = className;
    }

    invoke(name: string, method: string, params?: any): any {
        try {
            var instance = new this._classNames[name];
            return instance[method](params);
        } catch (err) {
            var msg: string = 'ClassRegistry invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    }

    get(name: string): any {
        return this._classNames[name];
    }
}

export class KeyRegistry implements api.IRPCRegistry {
    private _key: string;
    private _classRegistry: ClassRegistry;
    private _objects: { [name: string]: Object } = {};
    constructor(key: string, registry: ClassRegistry) {
        this._key = key;
        this._classRegistry = registry;
    }

    register(name: string, className: any) {
        throw 'Register method should not be use on KeyRegistry';
    }

    invoke(name: string, method: string, params?: any): any {
        try {
            var instance = this._objects[this._key + ':' + name];
            if (!instance) {
                console.log('create instance');
                var className = this._classRegistry.get(name);
                this._objects[this._key + ':' + name] = new className();
                instance = this._objects[this._key + ':' + name];
            }
            return instance[method](params);
        } catch (err) {
            var msg: string = 'KeyRegistry ' + this._key + ' invoke fail on ' + name + '.' + method;
            msg += (params) ? '(' + JSON.stringify(params) + ')' : '()';
            throw (msg);
        }
    }

    key() {
        return this._key;
    }

    get(name: string): any {
        return this._classRegistry.get(name);
    }
}

export class RPC {

    public static VERSION: string = '2.0';
    public static PARSE_ERROR: number = -32700;
    public static INVALID_REQUEST: number = -32600;
    public static METHOD_NOT_FOUND: number = -32601;
    public static INVALID_PARAMS: number = -32602;
    public static INTERNAL_ERROR: number = -32603;

    public static Response(id:string, result?:JSON) {
        return {
            'jsonrpc': RPC.VERSION,
            'result': (result) ? result : null,
            'id': (id) ? id : null
        }
    }

    public static Request(id:string, method:string, data?:JSON) {
        return {
            'jsonrpc': RPC.VERSION,
            'method': method,
            'params': data,
            'id': (id) ? id : null
        };
    }

    public static Error(id:string, code:number, message:string) {
        return {
            'jsonrpc': RPC.VERSION,
            'error': {
                'code': code,
                'message' : message
            },
            'id': (id) ? id : null
        };
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
        var _rpc = RPC.Request(this._context.id, this._context.method, this._context.data);
        if (this._context.ws) {
            WSRpcLogging.log('WSRpc', 'now', this._context.ws.url, JSON.stringify(_rpc));
            return this._context.ws.send(JSON.stringify(_rpc));
        } else {
            throw 'WS send error: connection may be closed';
        }
    }
    then(...callbacks:((data: JSON) => void)[]) {
        this._context.id =  this._context.method + ':' + UUIDGenerator.generateUUID();
        if (callbacks && callbacks.length > 0) {
            var eventBus: EventBus = EventBus.getSharedEventBus();
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

    private _onOpenCallback: (event: Event) => void;
    private _onCloseCallback: (event: CloseEvent) => void;
    private _onErrorCallback: (event: ErrorEvent) => void;
    private _onConnectCallback: () => void;

    constructor(url: string) {
        this._url = url;
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
            if (rpc.jsonrpc && rpc.jsonrpc === RPC.VERSION && rpc.id) {
                EventBus.getSharedEventBus().fire(rpc.id, rpc.result);
            }
        };

        this._ws.onerror = (event: ErrorEvent) => {
            WSRpcLogging.log('WSRpc', 'onerror', this._url, event);
            if (this._onErrorCallback) {
                setTimeout(this._onErrorCallback(event), 0);
            }
        };
    }

    public close():boolean {
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
            var eventBus: EventBus = EventBus.getSharedEventBus();
            for (var x = 0; x < callbacks.length; x++) {
                eventBus.on(about, callbacks[x]);
            }
        }
    }

    doRequest(action: string, data: JSON, ...callbacks: ((data: JSON) => void)[]) {
        var _rpc = null;
        if (callbacks && callbacks.length > 0) {
            var _uuid: string =  action + ':' + UUIDGenerator.generateUUID();
            var eventBus: EventBus = EventBus.getSharedEventBus();
            for (var x = 0; x < callbacks.length; x++) {
                eventBus.on(_uuid, callbacks[x]);
            }
            _rpc = RPC.Request(_uuid, action, data);
        } else {
            _rpc = RPC.Request(action, action, data);
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
            var eventBus: EventBus = EventBus.getSharedEventBus();
            for (var x = 0; x < callbacks.length; x++) {
                eventBus.on(action, callbacks[x]);
            }
        }
    }
}