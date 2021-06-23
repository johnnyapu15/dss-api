/* eslint-disable no-unused-vars */
interface CustomCache {
    addIntoSet(id: string, setId: string): Promise<Set<string>>;
    deleteKey(id: string): void;
    deleteFromSet(id: string, setId: string): Promise<Set<string>>;
    pushIntoArray(id: string, data?: string): void;
    popFromArray(id: string): Promise<string | undefined>;
    pget(pattern: string): Promise<string[]>;
    set(key:string, value:string): Promise<unknown>;
    get(key:string): Promise<string | null>;
    del(key:string): Promise<number>;
    exists(key:string): Promise<number>;
    smembers(key:string): Promise<string[]>;
    sismember(setId:string, id: string): Promise<number>;
}
