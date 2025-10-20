import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const payload = verifyRequest(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized', authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          userId: payload.userId,
          username: payload.username,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', authenticated: false },
      { status: 500 }
    );
  }
}
