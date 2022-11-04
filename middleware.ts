import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/email') {
    return NextResponse.rewrite(new URL('/api/email', request.url))
  }
  if (request.nextUrl.pathname === '/email-attach') {
    return NextResponse.rewrite(new URL('/api/email-attach', request.url))
  }
}
