import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define a custom interface that extends NextRequest to include 'user'
interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export async function authorizedMiddleware(request: AuthenticatedRequest) {
  const token = await getToken({ req: request, secret: process.env.JWT_SECRET });

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
  }



  request.user = {
    id: token.id as string,
    username: token.username as string,
    role: token.role as string,
  };

  return null;
}
