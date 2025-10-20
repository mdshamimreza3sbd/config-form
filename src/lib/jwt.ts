import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export interface JWTPayload {
  userId: string;
  username: string;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from cookie
  const tokenFromCookie = request.cookies.get('token')?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  // Try to get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export function verifyRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}
