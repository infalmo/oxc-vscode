import { ConfigurationChangeEvent, workspace } from "vscode";
import { ConfigService } from "./ConfigService";

const DEFAULT_OXLINT_CMD = "npx --no-install oxlint --lsp";
const DEFAULT_OXFMT_CMD = "npx --no-install oxfmt --lsp";

export class VSCodeConfig implements VSCodeConfigInterface {
  private _enableOxlint!: boolean;
  private _enableOxfmt!: boolean;
  private _trace!: TraceLevel;
  private _oxlintCmd!: string;
  private _oxfmtCmd!: string;
  private _tsgolintPath: string | undefined;
  private _requireConfig!: boolean;
  private _suppressProgramErrors!: boolean;

  constructor() {
    this.refresh();
  }

  private get configuration() {
    return workspace.getConfiguration(ConfigService.namespace);
  }

  public refresh(): void {
    let enable =
      this.configuration.get<boolean | null | { oxlint?: boolean; oxfmt?: boolean }>("enable") ??
      true;

    if (typeof enable === "boolean") {
      // If main enable is true, both tools are enabled
      // this is how VS Code resolves config. `oxc.enable` always wins over  `oxc.enable.oxlint` and `oxc.enable.oxfmt`
      enable = { oxlint: enable, oxfmt: enable };
    } else if (typeof enable === "object") {
      // If main enable is an object, we need to ensure both keys are present
      enable = {
        oxlint: enable.oxlint ?? true,
        oxfmt: enable.oxfmt ?? true,
      };
    } else {
      // Fallback to enabling both if the config is somehow invalid
      enable = { oxlint: true, oxfmt: true };
    }

    this._enableOxlint = enable.oxlint!;
    this._enableOxfmt = enable.oxfmt!;
    this._trace = this.configuration.get<TraceLevel>("trace.server") || "off";
    this._oxlintCmd = this.configuration.get<string>("cmd.oxlint") || DEFAULT_OXLINT_CMD;
    this._oxfmtCmd = this.configuration.get<string>("cmd.oxfmt") || DEFAULT_OXFMT_CMD;
    this._tsgolintPath = this.configuration.get<string>("path.tsgolint") || undefined;
    this._requireConfig = this.configuration.get<boolean>("requireConfig") ?? false;
    this._suppressProgramErrors = this.configuration.get<boolean>("suppressProgramErrors") ?? false;
  }

  get enableOxlint(): boolean {
    return this._enableOxlint;
  }

  updateEnableOxlint(value: boolean): PromiseLike<void> {
    this._enableOxlint = value;
    return this.configuration.update("enable.oxlint", value);
  }

  get enableOxfmt(): boolean {
    return this._enableOxfmt;
  }

  updateEnableOxfmt(value: boolean): PromiseLike<void> {
    this._enableOxfmt = value;
    return this.configuration.update("enable.oxfmt", value);
  }

  get trace(): TraceLevel {
    return this._trace;
  }

  updateTrace(value: TraceLevel): PromiseLike<void> {
    this._trace = value;
    return this.configuration.update("trace.server", value);
  }

  get oxlintCmd(): string {
    return this._oxlintCmd;
  }

  get oxfmtCmd(): string {
    return this._oxfmtCmd;
  }

  get tsgolintPath(): string | undefined {
    return this._tsgolintPath;
  }

  get requireConfig(): boolean {
    return this._requireConfig;
  }

  updateRequireConfig(value: boolean): PromiseLike<void> {
    this._requireConfig = value;
    return this.configuration.update("requireConfig", value);
  }

  get suppressProgramErrors(): boolean {
    return this._suppressProgramErrors;
  }

  updateSuppressTsconfigErrors(value: boolean): PromiseLike<void> {
    this._suppressProgramErrors = value;
    return this.configuration.update("suppressProgramErrors", value);
  }

  effectsOxlintConnection(event: ConfigurationChangeEvent): boolean {
    return (
      event.affectsConfiguration(`${ConfigService.namespace}.cmd.oxlint`) ||
      event.affectsConfiguration(`${ConfigService.namespace}.path.tsgolint`)
    );
  }

  effectsOxfmtConnection(event: ConfigurationChangeEvent): boolean {
    return event.affectsConfiguration(`${ConfigService.namespace}.cmd.oxfmt`);
  }
}

type TraceLevel = "off" | "messages" | "verbose";

/**
 * See `"contributes.configuration"` in `package.json`
 */
interface VSCodeConfigInterface {
  /**
   * `oxc.enable.oxlint`
   *
   * @default true (falls back to `oxc.enable` if not set)
   */
  enableOxlint: boolean;
  /**
   * `oxc.enable.oxfmt`
   *
   * @default true (falls back to `oxc.enable` if not set)
   */
  enableOxfmt: boolean;
  /**
   * Trace VSCode <-> Oxc Language Server communication
   * `oxc.trace.server`
   *
   * @default 'off'
   */
  trace: TraceLevel;
  /**
   * Command to run the oxlint LSP server
   * `oxc.cmd.oxlint`
   * @default "npx --no-install oxlint --lsp"
   */
  oxlintCmd: string;
  /**
   * Command to run the oxfmt LSP server
   * `oxc.cmd.oxfmt`
   * @default "npx --no-install oxfmt --lsp"
   */
  oxfmtCmd: string;
  /**
   * Path to the tsgolint binary, passed as `OXLINT_TSGOLINT_PATH` to oxlint.
   * `oxc.path.tsgolint`
   * @default undefined (oxlint auto-detects)
   */
  tsgolintPath: string | undefined;
  /**
   * Start the language server only when a `.oxlintrc.json` file exists in one of the workspaces.
   * `oxc.requireConfig`
   * @default false
   */
  requireConfig: boolean;
  /**
   * Suppress tsconfig errors from tsgolint and still lint files under partially-valid tsconfig projects.
   * `oxc.suppressProgramErrors`
   * @default false
   */
  suppressProgramErrors: boolean;
}
