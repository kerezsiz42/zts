import { assertEquals, assertMatch } from "@std/assert";
import { ScryptPassword } from "./crypto.ts";

Deno.test({
  name: "ScryptPassword",
  async fn(t) {
    await t.step("Should hash a password", async () => {
      const scryptPassword = new ScryptPassword();
      const password = "mySecurePassword";
      const [hash, err] = await scryptPassword.hash(password);
      if (err !== null) {
        throw `${err}`;
      }

      assertMatch(hash, /^[a-f0-9]{16}:[a-f0-9]{128}$/);
    });

    await t.step("Should return true for a correct password", async () => {
      const scryptPassword = new ScryptPassword();
      const password = "mySecurePassword";
      const [hash, err] = await scryptPassword.hash(password);
      if (err !== null) {
        throw `${err}`;
      }

      const [isValid, err2] = await scryptPassword.verify(password, hash);
      if (err2 !== null) {
        throw `${err2}`;
      }

      assertEquals(isValid, true);
    });

    await t.step("Should return false for an incorrect password", async () => {
      const scryptPassword = new ScryptPassword();
      const [hash, err] = await scryptPassword.hash("mySecurePassword");
      if (err !== null) {
        throw `${err}`;
      }

      const [isValid, err2] = await scryptPassword.verify(
        "notMySecurePassword",
        hash
      );
      if (err2 !== null) {
        throw `${err2}`;
      }

      assertEquals(isValid, false);
    });
  },
});
