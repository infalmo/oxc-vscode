import { strictEqual } from "assert";
import { buildExecutable } from "../../client/tools/lsp_helper";

suite("buildExecutable", () => {
  test("should pass the command string through as-is", () => {
    const result = buildExecutable("npx --no oxlint --lsp");

    strictEqual(result.command, "npx --no oxlint --lsp");
    strictEqual(result.options?.shell, true);
  });

  test("should set default environment variables", () => {
    const result = buildExecutable("npx --no oxlint --lsp");

    strictEqual(result.options?.env?.NO_COLOR, "1");
    strictEqual(result.options?.env?.OXC_LOG, "info");
  });

  test("should merge extra environment variables", () => {
    const result = buildExecutable("npx --no oxlint --lsp", {
      OXLINT_TSGOLINT_PATH: "/path/to/tsgolint",
    });

    strictEqual(result.options?.env?.OXLINT_TSGOLINT_PATH, "/path/to/tsgolint");
    strictEqual(result.options?.env?.NO_COLOR, "1");
  });
});
