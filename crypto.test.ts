import { assertEquals } from "jsr:@std/assert";

Deno.test({
  name: "example test",
  fn() {
    assertEquals("world", "world");
  },
});
