import { NextResponse } from 'next/server';
import { getAuditLog } from '../../../src/agent-harness';
export function GET() { return NextResponse.json(getAuditLog()); }
