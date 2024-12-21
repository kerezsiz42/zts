import { contentType } from "@std/media-types";
import { extname } from "@std/path";

import { erroneous, type Fallible } from "./error.ts";

/**
 * Loads files from filesystem and serves them with client-side caching configured.
 *
 * ```
 * Client                Server
 *    |---- Request ------->|
 *    | GET /resource       |  (1) Client requests a resource
 *    |                     |
 *    |<--- Response -------|
 *    | 200 OK              |  (2) Server responds with the resource, etag and cache control headers
 *    | ETag: abc123        |
 *    | Cache-Control: max-age=3600 |
 *    |                     |
 *    |---- Request --------|
 *    | GET /resource       |  (3) Client requests the resource again
 *    | If-None-Match: abc123 |
 *    |                     |
 *    |<--- Response -------|
 *    | 304 Not Modified    |  (4) Server responds with 304 if ETag matches
 * ```
 */
export class SendFile {
  /** Associates filepaths with the calculated etags */
  static cache = new Map<string, string>();

  /** The max-age value for the cache-control header */
  static maxAge = 3600;

  static async handle(req: Request, ctx: Context): Promise<Fallible<Response>> {
    const reqEtag = req.headers.get("If-None-Match") ?? "";
    const path = ctx.url.pathname.slice(1);
    if (SendFile.cache.get(path) === reqEtag) {
      return [new Response(null, { status: 304 }), null] as const;
    }

    const [content, err] = await erroneous(() => Deno.readFile(path));
    if (err !== null) {
      return [
        new Response("Internal Server Error", { status: 500 }),
        null,
      ] as const;
    }

    const digest = await crypto.subtle.digest("SHA-256", content);

    let etag = "";
    for (const byte of new Uint8Array(digest)) {
      etag += byte.toString(16).padStart(2, "0");
    }

    SendFile.cache.set(path, etag);

    return [
      new Response(content, {
        headers: {
          ETag: etag,
          "Content-Type": contentType(extname(path)) ?? "text/plain",
          "Cache-Control": `max-age=${SendFile.maxAge}`,
        },
      }),
      null,
    ] as const;
  }
}

const methods = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "CONNECT",
  "OPTIONS",
  "TRACE",
  "PATCH",
] as const;

export type Method = (typeof methods)[number];

export type Context = {
  urlPatternResult: URLPatternResult;
  url: URL;
  cookies: { [k: string]: string | undefined };
};

export type Handler = (
  req: Request,
  ctx: Context
) => Promise<Fallible<Response>> | Fallible<Response>;

export type Middleware = (next: Handler) => Handler;

export type Route = {
  pattern: URLPattern;
  handlers: HandlersByMethods;
};

type HandlersByMethods = { [key in Method]?: Handler };

export function addMiddlewareToRoutes(
  middleware: Middleware,
  ...routes: Route[]
): Route[] {
  return routes.map(({ pattern, handlers }) => ({
    pattern,
    handlers: Object.fromEntries(
      Object.entries(handlers).map(([method, handler]) => [
        method,
        middleware(handler),
      ])
    ),
  }));
}

export function defaultHandler(handler: Handler): HandlersByMethods {
  return Object.fromEntries(methods.map((method) => [method, handler]));
}

export function json<T>(data: T, headers?: HeadersInit): Fallible<Response> {
  const res = new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  return [res, null] as const;
}

export function handlerFromRoutes(
  routes: Route[]
): (req: Request) => Response | Promise<Response> {
  return async (req: Request) => {
    for (const { pattern, handlers } of routes) {
      const url = new URL(req.url);

      const urlPatternResult = pattern.exec(url);
      if (urlPatternResult === null) {
        continue;
      }

      if (!(req.method in handlers)) {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: Object.keys(handlers).join(", ") },
        });
      }

      const handler = handlers[req.method as Method] as Handler;
      const ctx: Context = {
        urlPatternResult,
        url,
        cookies: {},
      };

      const [res, err] = await handler(req, ctx);
      if (err !== null) {
        return new Response("Internal Server Error", { status: 500 });
      }

      return res;
    }

    return new Response("Not Found", { status: 404 });
  };
}
