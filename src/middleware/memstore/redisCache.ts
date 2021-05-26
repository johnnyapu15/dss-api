/* eslint-disable no-unused-vars */
import redis from 'redis';
import { promisify } from 'util';
import { BadRequestError, NotFoundError } from '../error';

class RedisCache implements CustomCache {
  getClient = redis.createClient;

  async addIntoSet(id: string, setId: string) {
    const client = this.getClient();
    const sadd = <(arg0: string, arg1: string) => Promise<number>>
      promisify(client.sadd).bind(client);
    await sadd(setId, id);

    const get = promisify(client.smembers).bind(client);
    const got = await get(setId);
    return new Set(got);
  }

  deleteKey(id: string) {
    const client = this.getClient();
    client.del(id);
  }

  async deleteFromSet(id: string, setId: string) {
    const client = this.getClient();
    const srem = <(arg0: string) => Promise<number>>promisify(client.srem).bind(client);
    await srem(id);

    const get = promisify(client.smembers).bind(client);
    const got = await get(setId);
    return new Set(got);
  }

  async pushIntoArray(id: string, data?: string) {
    const client = this.getClient();
    const lpush = <(arg0: string, arg1: string) => Promise<number>>
      promisify(client.lpush).bind(client);
    if (data) {
      const len = await lpush(id, data);
      console.log(`PUSH INTO ${id} ... LENGTH: ${len}`);
    }
  }

  async popFromArray(id: string) {
    const client = this.getClient();
    const lpop = <(arg0: string) => Promise<string | undefined>>
      promisify(client.lpop).bind(client);
    const got = await lpop(id);
    if (!got) {
      throw new NotFoundError('Invalid id');
    } else {
      return got;
    }
  }
}
