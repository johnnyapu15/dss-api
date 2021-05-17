import { BadRequestError, NotFoundError } from '../error';

/**
 * TODO
 * 확장 가능하려면 외부 DB를 이용해야 함.
 * 외부 DB를 이용한다고 하면 서버 인스턴스에서 관리하는 소켓들이
 * 해당 DB를 이벤트 리스너로 연결돼야 함.
 */
const globalCache: { [key: string]: Set<string> | string[] } = {};

export async function addIntoSet(id: string, setId: string) {
  let isInit = false;
  const got = globalCache[setId];
  if (!got) {
    globalCache[setId] = new Set<string>();
    isInit = true;
  }
  if (!id) {
    throw new BadRequestError('Invalid id');
  }
  (globalCache[setId] as Set<string>).add(id);
  const set = globalCache[setId] as Set<string>;

  return { isInit, set: [...set] };
}

export async function deleteKey(id: string) {
  delete (globalCache[id]);
}

export async function deleteFromSet(id: string, setId: string) {
  const got = globalCache[setId];
  if (!got || !(got instanceof Set) || !got.has(id)) {
    throw new NotFoundError('Invalid id');
  } else {
    (globalCache[setId] as Set<string>).delete(id);
    const set = globalCache[setId] as Set<string>;
    if ((globalCache[setId] as Set<string>).size === 0) {
      deleteKey(setId);
    }
    return { set: [...set] };
  }
}

export async function pushIntoArray(id: string, data?: string) {
  if (!globalCache[id]) {
    globalCache[id] = [];
  }
  if (data) {
    const cache = globalCache[id] as string[];
    cache.push(data);
    console.log(cache);
  }

  return 0;
}

export async function popFromArray(id: string) {
  const got = globalCache[id] as string[];
  if (!got || got.length === 0) {
    throw new NotFoundError('Invalid id');
  } else {
    const data = got.shift();
    return data;
  }
}
