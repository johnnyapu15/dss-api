/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
import InMemoryCache from './inMemoryCache';
import RedisCache from './redisCache';

const cache = (() => {
  // REDIS_HOST 환경변수가 없으면 inmemory cache를 사용함.
  if (process.env.REDIS_HOST) {
    console.log('Using redis cache...');
    return new RedisCache();
  }
  console.log('Using in-memory cache...');
  return new InMemoryCache();
})();

export default cache;
