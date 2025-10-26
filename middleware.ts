import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = path === '/'

    // Fetch the session token using next-auth/jwt
    const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // If the user is signed in and tries to access the signup page, redirect them based on their role
    if (isPublicPath && session) {
      const role = session.role;  // Assuming 'role' is part of the token
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.nextUrl));
      } else if (role === 'doctor') {
        return NextResponse.redirect(new URL('/doctor', request.nextUrl));
      } else if (role === 'reception') {
        return NextResponse.redirect(new URL('/reception', request.nextUrl));
      } else if (role === 'labratory') {
        return NextResponse.redirect(new URL('/labratory', request.nextUrl));
      } else if (role === 'User') {
        return NextResponse.redirect(new URL('/user', request.nextUrl));
      }

      else if (role === 'nurse') {
        return NextResponse.redirect(new URL('/nurse', request.nextUrl));
      }
      // Add other role-based redirection here if needed laboratory
    }
  

  // If the user is not signed in and tries to access a protected route, redirect to  page
  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  // If everything is fine, continue to the requested route
  return NextResponse.next()
}

// Protect specific routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/reception/:path*',
  ],
}
