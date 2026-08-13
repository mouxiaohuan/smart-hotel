import 'dotenv/config';
import { RedisSaver } from '@langchain/langgraph-checkpoint-redis';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is required for durable HITL checkpoints.');

const client = createClient({ url: redisUrl });
client.on('error', (error) => console.error('Redis error:', error));
const ready = client.connect();
export const refundCheckpointer = await RedisSaver.fromUrl(redisUrl);

const key = (threadId: string) => `smart-hotel:refund:${threadId}`;

export async function saveRefundRequest(threadId: string, value: unknown) {
  await ready;
  await client.set(key(threadId), JSON.stringify(value), { EX: 60 * 60 * 24 * 7 });
}

export async function loadRefundRequest<T>(threadId: string): Promise<T | undefined> {
  await ready;
  const value = await client.get(key(threadId));
  return value ? JSON.parse(value) as T : undefined;
}

export async function closeRefundStore() { await refundCheckpointer.end(); await client.quit(); }
