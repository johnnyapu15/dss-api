import { BadRequestError, NotFoundError } from "../error";

/**
 * TODO
 * 확장 가능하려면 외부 DB를 이용해야 함. 
 * 외부 DB를 이용한다고 하면 서버 인스턴스에서 관리하는 소켓들이
 * 해당 DB를 이벤트 리스너로 연결돼야 함.
 */
const _globalCache: { [key: string]: Set<string> | string[] } = {};


export async function addIntoSet(id: string, setId: string) {
    try {
        let isInit = false;
        const got = _globalCache[setId]
        if (!got) {
            _globalCache[setId] = new Set<string>();
            isInit = true;
        }
        if (!id) {
            throw new BadRequestError('Invalid id');
        }
        (_globalCache[setId] as Set<string>).add(id);
        const set = _globalCache[setId] as Set<string>
        
        return {isInit, set:[...set]};
    } catch (e) {
        throw (e);
    }
}

export async function deleteFromSet(id: string, setId: string) {
    try {
        const got = _globalCache[setId]
        if (!got || !(got instanceof Set) || !got.has(id)) {
            throw new NotFoundError('Invalid id');
        } else {
            (_globalCache[setId] as Set<string>).delete(id);
            const set = _globalCache[setId] as Set<string>
            if ((_globalCache[setId] as Set<string>).size === 0) {
                deleteKey(setId)
            }
            return {set:[...set]};
        }
    } catch (e) {
        throw e;
    }
}

export async function deleteKey(id: string) {
    delete(_globalCache[id])
}

export async function pushIntoArray(id: string, data?: string) {
    try {
        if (!_globalCache[id]) {
            _globalCache[id] = [];
        }
        if (data) {
            const cache = _globalCache[id] as string[];
            cache.push(data);
            console.log(cache)
        }
        
        return 0;
    } catch (e) {
        throw (e);
    }
}


export async function popFromArray(id: string) {
    try {
        const got = _globalCache[id] as string[];
        if (!got || got.length === 0) {
            throw new NotFoundError('Invalid id');
        } else {
            const data = got.shift();
            return data;
        }
    } catch (e) {
        throw e;
    }
}