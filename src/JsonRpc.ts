export class RpcMessage {
    _code: number;
    _message: string;
    _id: string;
    _broadcast: boolean;
    _namedMethod: string;
    _namedInstance: string;
    _namedAction: string;
    _result: JSON;
    _params: JSON;

    constructor(rpc) {
        if (rpc.jsonrpc !== '2.0') {
            throw 'Json-RPC Message Error';
        }
        this._id = rpc.id;
        this._broadcast = false;
        if (rpc.error) {
            this._code = rpc.error.code;
            this._message = rpc.error.message;
        }
        else if (rpc.method) {
            this._params = rpc.params;
            var t = rpc.method.split('.');
            if (t.length == 2) {
                this._namedAction = null;
                this._namedMethod = t[t.length - 1];
                if (t[0].split('}')[0] === '{broadcast') {
                    this._broadcast = true;
                    this._namedInstance = t[0].split('}')[1];
                } else {
                    this._namedInstance = t[0];
                }
            } else {
                this._namedInstance = null;
                this._namedMethod = null;
                if (t[0].split('}')[0] === '{broadcast') {
                    this._broadcast = true;
                    this._namedAction = t[0].split('}')[1];
                } else {
                    this._namedAction = t[0];
                }
            }
        }
        else {
            this._result = rpc.result;
        }
    }

    isError(): boolean {
        return (this._code !== undefined);
    }

    isRequest(): boolean {
        return (this._namedMethod !== undefined || this._namedAction !== undefined);
    }

    isResponse(): boolean {
        return (this._result !== undefined);
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

    getInstance(): string {
        return this._namedInstance;
    }

    getAction(): string {
        return this._namedAction;
    }

    getId(): string {
        return this._id;
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