import { strictEqual } from "assert";
import { workspace } from "vscode";
import { ConfigService } from "../../client/ConfigService.js";
import { WORKSPACE_FOLDER } from "../test-helpers.js";

const conf = workspace.getConfiguration("oxc");

suite("ConfigService", () => {
  const keys = ["cmd.oxlint", "cmd.oxfmt", "path.tsgolint"];

  setup(async () => {
    await Promise.all(keys.map((key) => conf.update(key, undefined)));
  });

  teardown(async () => {
    await Promise.all(keys.map((key) => conf.update(key, undefined)));
  });

  test("workspace config is created for each workspace folder", () => {
    const service = new ConfigService();

    const workspaceConfig = service.getWorkspaceConfig(WORKSPACE_FOLDER.uri);
    strictEqual(workspaceConfig !== undefined, true);
    service.dispose();
  });

  test("oxlintCmd defaults to npx --no-install oxlint --lsp", () => {
    const service = new ConfigService();
    strictEqual(service.vsCodeConfig.oxlintCmd, "npx --no-install oxlint --lsp");
    service.dispose();
  });

  test("oxfmtCmd defaults to npx --no-install oxfmt --lsp", () => {
    const service = new ConfigService();
    strictEqual(service.vsCodeConfig.oxfmtCmd, "npx --no-install oxfmt --lsp");
    service.dispose();
  });
});
