export declare module api {
    interface IRPCRegistry {
        register(name: string, classname: any): any;
        invoke(name: string, method: string, params?: any): any;
        get(name: string): any;
    }
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
