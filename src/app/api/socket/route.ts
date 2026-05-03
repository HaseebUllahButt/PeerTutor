import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Socket.io server endpoint. Connect via WebSocket client.'
  });
}
