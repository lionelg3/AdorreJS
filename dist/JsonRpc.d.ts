export declare class RPC {
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
    getInstance(): string;
    getId(): string;
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
