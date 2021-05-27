/* eslint-disable no-unused-vars */
import redis from 'redis';
import { promisify } from 'util';
import { BadRequestError, NotFoundError } from '../error';

export default class RedisCache implements CustomCache {
  port = process.env.REDIS_PORT || 6379

  host = process.env.REDIS_HOST || 'localhost'

  getClient = (() => (
    redis.createClient).bind(this.port,
      {
        host: this.host,
      } as redis.ClientOpts))();

  client = this.getClient();

  exists = <(arg0: string) => Promise<number>>
    promisify(this.client.exists).bind(this.client);

  del = promisify(this.client.del).bind(this.client);

  get = promisify(this.client.get).bind(this.client);

  set = <(arg0: string, arg1: string) => Promise<redis.Callback<'OK'> | undefined>>
    promisify(this.client.set).bind(this.client);

  keys = promisify(this.client.keys).bind(this.client);

  mget = <(arg0: string[]) => Promise<string[]>> promisify(this.client.mget).bind(this.client);

  pget = async (pattern: string):Promise<string[]> => {
    const keys = await this.keys(pattern);
    return this.mget(keys);
  }

  sadd = <(arg0: string, arg1: string) => Promise<number>>
    promisify(this.client.sadd).bind(this.client);

  smembers = promisify(this.client.smembers).bind(this.client);

  srem = <(arg0: string, arg1: string) => Promise<number>>
    promisify(this.client.srem).bind(this.client);

  lpush = <(arg0: string, arg1: string) => Promise<number>>
    promisify(this.client.lpush).bind(this.client);

  lpop = <(arg0: string) => Promise<string | undefined>>
    promisify(this.client.lpop).bind(this.client);

  async addIntoSet(id: string, setId: string) {
    await this.sadd(setId, id);
    const got = await this.smembers(setId);
    return new Set(got);
  }

  deleteKey(id: string) {
    this.client.del(id);
  }

  async deleteFromSet(id: string, setId: string) {
    await this.srem(setId, id);

    const got = await this.smembers(setId);
    return new Set(got);
  }

  async pushIntoArray(id: string, data?: string) {
    if (data) {
      const len = await this.lpush(id, data);
      console.log(`PUSH INTO ${id} ... LENGTH: ${len}`);
    }
  }

  async popFromArray(id: string) {
    const got = await this.lpop(id);
    if (!got) {
      throw new NotFoundError('Invalid id');
    } else {
      return got;
    }
  }
}
