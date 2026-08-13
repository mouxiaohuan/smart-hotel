import { randomUUID } from 'node:crypto';

type AuditRecord = { runId: string; threadId: string; event: string; at: string; metadata?: Record<string, unknown> };

const auditLog: AuditRecord[] = [];
const circuit = { failures: 0, openedUntil: 0 };
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 30_000;

export const graphRunConfig = (threadId: string) => ({
  configurable: { thread_id: threadId, recursion_limit: Number(process.env.AGENT_RECURSION_LIMIT ?? 12) },
  recursion_limit: Number(process.env.AGENT_RECURSION_LIMIT ?? 12)
});

export function audit(event: string, threadId: string, metadata?: Record<string, unknown>) {
  const record = { runId: randomUUID(), threadId, event, at: new Date().toISOString(), metadata };
  auditLog.push(record);
  if (auditLog.length > 500) auditLog.shift();
  console.info('[agent-audit]', JSON.stringify(record));
}

export function getAuditLog() { return auditLog.slice(-100); }

export function assertCircuitClosed() {
  if (circuit.openedUntil > Date.now()) throw new Error('Agent 暂时熔断，请稍后重试。');
  if (circuit.openedUntil) { circuit.openedUntil = 0; circuit.failures = 0; }
}

export function recordSuccess(threadId: string) { circuit.failures = 0; audit('run.success', threadId); }
export function recordFailure(threadId: string, error: unknown) {
  circuit.failures += 1;
  if (circuit.failures >= FAILURE_THRESHOLD) circuit.openedUntil = Date.now() + COOLDOWN_MS;
  audit('run.failure', threadId, { error: error instanceof Error ? error.message : String(error), failures: circuit.failures });
}

export async function withHarness<T>(threadId: string, operation: () => Promise<T>, timeoutMs = Number(process.env.AGENT_TIMEOUT_MS ?? 20_000)) {
  assertCircuitClosed();
  audit('run.start', threadId, { timeoutMs });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Agent 执行超时。')), timeoutMs); });
    const result = await Promise.race([operation(), timeout]);
    recordSuccess(threadId);
    return result;
  } catch (error) {
    recordFailure(threadId, error);
    throw error;
  } finally { if (timer) clearTimeout(timer); }
}
