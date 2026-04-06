import { ok } from "assert";
import { env } from "vscode";
import { copyDebugCommand } from "../../client/commands";
import type { VSCodeConfig } from "../../client/VSCodeConfig";

function createConfig(
  oxlintCmd = "npx --no-install oxlint --lsp",
  oxfmtCmd = "npx --no-install oxfmt --lsp",
): VSCodeConfig {
  return {
    oxlintCmd,
    oxfmtCmd,
  } as VSCodeConfig;
}

suite("commands", () => {
  suite("copyDebugCommand", () => {
    test("copies debug info to clipboard with correct versions", async () => {
      await copyDebugCommand("1.50.0", "0.16.0", "0.5.0", createConfig());

      const clipboardContent = await env.clipboard.readText();

      ok(
        clipboardContent.includes("VS Code extension: v1.50.0"),
        "should include extension version",
      );
      ok(clipboardContent.includes("oxlint: v0.16.0"), "should include oxlint version");
      ok(clipboardContent.includes("oxfmt: v0.5.0"), "should include oxfmt version");
      ok(clipboardContent.includes("Editor:"), "should include editor info");
      ok(clipboardContent.includes("Operating System and Version:"), "should include OS info");
      ok(clipboardContent.includes("oxlint cmd:"), "should include oxlint cmd");
      ok(clipboardContent.includes("oxfmt cmd:"), "should include oxfmt cmd");
      ok(
        clipboardContent.includes("```\nVS Code extension:"),
        "should start code fence before versions",
      );
      ok(clipboardContent.endsWith("```"), "should end with code fence");
    });

    test("includes the configured commands in debug info", async () => {
      await copyDebugCommand(
        "1.50.0",
        "0.16.0",
        "0.5.0",
        createConfig("bunx oxlint --lsp", "bunx oxfmt --lsp"),
      );

      const clipboardContent = await env.clipboard.readText();

      ok(
        clipboardContent.includes("oxlint cmd: bunx oxlint --lsp"),
        "should show custom oxlint cmd",
      );
      ok(clipboardContent.includes("oxfmt cmd: bunx oxfmt --lsp"), "should show custom oxfmt cmd");
    });

    test("shows 'unknown' for tools that have not reported versions", async () => {
      await copyDebugCommand("1.50.0", "unknown", "unknown", createConfig());

      const clipboardContent = await env.clipboard.readText();

      ok(clipboardContent.includes("oxlint: vunknown"), "should show unknown for oxlint");
      ok(clipboardContent.includes("oxfmt: vunknown"), "should show unknown for oxfmt");
    });

    test("uses provided fallback extension version text", async () => {
      await copyDebugCommand("<unknown>", "unknown", "unknown", createConfig());

      const clipboardContent = await env.clipboard.readText();

      ok(
        clipboardContent.includes("VS Code extension: v<unknown>"),
        "should show provided fallback extension version",
      );
    });
  });
});
