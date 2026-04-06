import { strictEqual } from "assert";
import { workspace } from "vscode";
import { VSCodeConfig } from "../../client/VSCodeConfig.js";

const conf = workspace.getConfiguration("oxc");

suite("VSCodeConfig", () => {
  const keys = [
    "enable",
    "enable.oxlint",
    "enable.oxfmt",
    "requireConfig",
    "trace.server",
    "cmd.oxlint",
    "cmd.oxfmt",
    "path.tsgolint",
    "suppressProgramErrors",
  ];
  setup(async () => {
    await Promise.all(keys.map((key) => conf.update(key, undefined)));
  });

  teardown(async () => {
    await Promise.all(keys.map((key) => conf.update(key, undefined)));
  });

  test("default values on initialization", () => {
    const config = new VSCodeConfig();

    strictEqual(config.enableOxlint, true, "enableOxlint should default to true");
    strictEqual(config.enableOxfmt, true, "enableOxfmt should default to true");
    strictEqual(config.requireConfig, false);
    strictEqual(config.trace, "off");
    strictEqual(config.oxlintCmd, "npx --no-install oxlint --lsp");
    strictEqual(config.oxfmtCmd, "npx --no-install oxfmt --lsp");
    strictEqual(
      config.suppressProgramErrors,
      false,
      "suppressProgramErrors should default to false",
    );
  });

  test("update enable, will update enable.oxlint and enable.oxfmt respectively", async () => {
    await conf.update("enable", false);
    const config = new VSCodeConfig();

    strictEqual(config.enableOxlint, false);
    strictEqual(config.enableOxfmt, false);
  });

  test("update `enable.oxlint` to false, while `enable` is true", async () => {
    await conf.update("enable", true);
    await conf.update("enable.oxlint", false);
    const config = new VSCodeConfig();

    strictEqual(config.enableOxlint, true);
    strictEqual(config.enableOxfmt, true);
  });

  test("updating values updates the workspace configuration", async () => {
    const config = new VSCodeConfig();

    await Promise.all([
      config.updateEnableOxlint(false),
      config.updateEnableOxfmt(false),
      config.updateRequireConfig(true),
      config.updateTrace("messages"),
      config.updateSuppressTsconfigErrors(true),
    ]);

    const wsConfig = workspace.getConfiguration("oxc");

    strictEqual(wsConfig.get("enable.oxlint"), false);
    strictEqual(wsConfig.get("enable.oxfmt"), false);
    strictEqual(wsConfig.get("requireConfig"), true);
    strictEqual(wsConfig.get("trace.server"), "messages");
    strictEqual(wsConfig.get("suppressProgramErrors"), true);
  });

  test("effectsOxlintConnection detects changes to oxlint connection related settings", async () => {
    const config = new VSCodeConfig();
    const wsConfig = workspace.getConfiguration("oxc");

    const testCases = [
      { key: "cmd.oxlint", affects: true },
      { key: "path.tsgolint", affects: true },
      { key: "requireConfig", affects: false },
      { key: "cmd.oxfmt", affects: false },
    ];

    for (const { key, affects } of testCases) {
      let promise = new Promise<void>((resolve) => {
        const disposer = workspace.onDidChangeConfiguration((event) => {
          strictEqual(config.effectsOxlintConnection(event), affects);
          disposer.dispose();
          resolve();
        });
      });

      wsConfig.update(key, "testValue");
      // oxlint-disable-next-line no-await-in-loop -- testing sequentially to ensure correct event handling
      await promise;
    }
  });

  test("effectsOxfmtConnection detects changes to oxfmt connection related settings", async () => {
    const config = new VSCodeConfig();
    const wsConfig = workspace.getConfiguration("oxc");

    const testCases = [
      { key: "cmd.oxfmt", affects: true },
      { key: "path.tsgolint", affects: false },
      { key: "requireConfig", affects: false },
      { key: "cmd.oxlint", affects: false },
    ];

    for (const { key, affects } of testCases) {
      let promise = new Promise<void>((resolve) => {
        const disposer = workspace.onDidChangeConfiguration((event) => {
          strictEqual(config.effectsOxfmtConnection(event), affects);
          disposer.dispose();
          resolve();
        });
      });

      wsConfig.update(key, "testValue");
      // oxlint-disable-next-line no-await-in-loop -- testing sequentially to ensure correct event handling
      await promise;
    }
  });
});
