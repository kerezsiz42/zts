import { assertEquals } from "@std/assert";

import { handlerFromRoutes, SendFile } from "./http.ts";

Deno.test({
  name: "SendFile",
  permissions: { read: true },
  async fn(t) {
    const handler = handlerFromRoutes([
      {
        pattern: new URLPattern({ pathname: "/http.ts" }),
        handlers: { GET: SendFile.handle },
      },
    ]);

    let etag = "";

    await t.step({
      name: "Should load file and respond with 200",
      async fn() {
        const req = new Request("http://localhost/http.ts", { method: "GET" });
        const res = await handler(req);

        assertEquals(res.status, 200);
        etag = res.headers.get("ETag") ?? "";
      },
    });

    await t.step({
      name: "Should load cached file and respond with 304",
      async fn() {
        const req = new Request("http://localhost/http.ts", {
          method: "GET",
          headers: { "If-None-Match": etag },
        });
        const res = await handler(req);

        assertEquals(res.status, 304);
      },
    });
  },
});
