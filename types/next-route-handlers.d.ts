// Custom type definitions for Next.js 15 route handlers
import { NextRequest } from 'next/server';

declare module 'next/server' {
  // Define the context parameter for dynamic route handlers
  export interface RouteHandlerContext<Params extends Record<string, string> = Record<string, string>> {
    params: Params;
  }

  // Define the route handler function types
  export type RouteHandler<
    Params extends Record<string, string> = Record<string, string>
  > = (
    req: NextRequest,
    context: RouteHandlerContext<Params>
  ) => Promise<Response> | Response;
}
