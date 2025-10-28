import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redis = new IORedis(REDIS_URL);

// lightweight instance id for lock ownership
const INSTANCE_ID = `${process.pid}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

redis.on('error', (err) => console.error('Redis error', err));

export function getRedis() {
    return redis;
}

export function getInstanceId() {
    return INSTANCE_ID;
}

export default { getRedis, getInstanceId };
