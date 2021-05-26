/* eslint-disable class-methods-use-this */
import { BadRequestError, NotFoundError } from '../error';
// eslint-disable-next-line no-underscore-dangle
const _cache: { [key: string]: Set<string> | string[] } = { };
export default class InMemoryCache implements CustomCache {
  addIntoSet(id: string, setId: string) {
    const got = _cache[setId];
    if (!got) {
      _cache[setId] = new Set<string>();
    }
    if (!id) {
      throw new BadRequestError('Invalid id');
    }
    (_cache[setId] as Set<string>).add(id);
    const set = _cache[setId] as Set<string>;
    return new Promise<Set<string>>((resolve) => { resolve(set); });
  }

  deleteKey(id: string) {
    delete (_cache[id]);
  }

  deleteFromSet(id: string, setId: string) {
    const got = _cache[setId];
    if (!got || !(got instanceof Set) || !got.has(id)) {
      throw new NotFoundError(`Invalid id ${got}`);
    } else {
      (_cache[setId] as Set<string>).delete(id);
      const set = _cache[setId] as Set<string>;
      if ((_cache[setId] as Set<string>).size === 0) {
        this.deleteKey(setId);
      }
      return new Promise<Set<string>>((resolve) => { resolve(set); });
    }
  }

  pushIntoArray(id: string, data?: string) {
    if (!_cache[id]) {
      _cache[id] = [];
    }
    if (data) {
      const cache = _cache[id] as string[];
      cache.push(data);
      console.log(`PUSH INTO ${id} ... LENGTH: ${cache.length}`);
    }
  }

  popFromArray(id: string) {
    const got = _cache[id] as string[];
    let data: string | undefined;
    if (!got) {
      throw new NotFoundError('Invalid id');
    } else {
      data = got.shift();
    }

    return new Promise<string | undefined>((resolve) => { resolve(data); });
  }
}
