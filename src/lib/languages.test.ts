import { expect, test } from "bun:test";
import settings from "../../project.inlang/settings.json";
import { LANGUAGES } from "./languages.js";

test("an account can pick exactly the languages the web is translated into", () => {
	expect([...LANGUAGES]).toEqual(settings.locales);
});
