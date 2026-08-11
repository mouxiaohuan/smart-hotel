import { NextResponse } from 'next/server';
import { knowledgeBase } from '../../../data/knowledge';

export function GET() { return NextResponse.json(knowledgeBase); }
