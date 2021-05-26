interface CustomCache {
    // Target for adapter pattern
    addIntoSet(id: string, setId: string): Promise<Set<string>>;
    deleteKey(id: string):void;
    deleteFromSet(id: string, setId: string): Promise<Set<string>>;
    pushIntoArray(id: string, data?: string): void;
    popFromArray(id: string): Promise<string | undefined>;
}
