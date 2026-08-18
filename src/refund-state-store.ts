import 'dotenv/config';
import { MemorySaver } from '@langchain/langgraph';
import { RedisSaver } from '@langchain/langgraph-checkpoint-redis';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;
const useInMemoryStore = !redisUrl && process.env.NODE_ENV !== 'production';
if (!redisUrl && !useInMemoryStore) throw new Error('REDIS_URL is required for durable HITL checkpoints in production.');

const client = redisUrl ? createClient({ url: redisUrl }) : undefined;
client?.on('error', (error) => console.error('Redis error:', error));
const ready = client?.connect();
export const refundCheckpointer = redisUrl ? await RedisSaver.fromUrl(redisUrl) : new MemorySaver();
const inMemoryRefundRequests = new Map<string, unknown>();

if (useInMemoryStore) console.warn('REDIS_URL is not configured; using in-memory refund state for local development only.');

const key = (threadId: string) => `smart-hotel:refund:${threadId}`;

export async function saveRefundRequest(threadId: string, value: unknown) {
  if (!client) {
    inMemoryRefundRequests.set(threadId, value);
    return;
  }
  await ready;
  await client.set(key(threadId), JSON.stringify(value), { EX: 60 * 60 * 24 * 7 });
}

export async function loadRefundRequest<T>(threadId: string): Promise<T | undefined> {
  if (!client) return inMemoryRefundRequests.get(threadId) as T | undefined;
  await ready;
  const value = await client.get(key(threadId));
  return value ? JSON.parse(value) as T : undefined;
}

export async function closeRefundStore() {
  if (refundCheckpointer instanceof RedisSaver) await refundCheckpointer.end();
  await client?.quit();
}
