import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/email')) {
    return NextResponse.rewrite(new URL('/api/email', request.url))
  }
}
