import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'kevincarmen-web',
    timestamp: new Date().toISOString(),
  });
}
