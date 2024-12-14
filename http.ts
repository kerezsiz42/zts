import { contentType } from "@std/media-types";
import { extname } from "@std/path";

import { Err, type Fallible } from "./error.ts";

export async function sendContent(path: string): Promise<Handler> {
  try {
    const content = await Deno.readFile(path);
    const ct = contentType(extname(path)) ?? "text/plain";
    return () =>
      [
        new Response(content, {
          headers: { "Content-Type": ct },
        }),
        null,
      ] as const;
  } catch (err) {
    if (err instanceof Error) {
      return () => [null, new Err(err.message)] as const;
    }
    throw err;
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
  pathParams: { [k: string]: string | undefined };
  searchParams: URLSearchParams;
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

export function handlerFromRoutes(routes: Route[]): Deno.ServeHandler {
  return async (req: Request) => {
    for (const { pattern, handlers } of routes) {
      const url = new URL(req.url);

      const result = pattern.exec(url);
      if (result === null) {
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
        pathParams: result.pathname.groups ?? {},
        searchParams: url.searchParams,
        cookies: {},
      };

      try {
        const [res, err] = await handler(req, ctx);
        if (err !== null) {
          return new Response("Internal Server Error", { status: 500 });
        }

        return res;
      } catch {
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  };
}
