import { ConfigurationTarget, LogOutputChannel, window, workspace } from "vscode";
import { Executable, MessageType, ShowMessageParams } from "vscode-languageclient/node";

export function buildExecutable(
  cmd: string,
  cwd?: string,
  extraEnv?: Record<string, string>,
): Executable {
  return {
    command: cmd,
    options: {
      shell: true,
      cwd,
      env: {
        ...process.env,
        RUST_LOG: process.env.RUST_LOG || "info",
        OXC_LOG: process.env.OXC_LOG || "info",
        NO_COLOR: "1",
        ...extraEnv,
      },
    },
  };
}

/**
 * Gates the user-configurable `oxc.cmd.oxlint` / `oxc.cmd.oxfmt` commands
 * against the `oxc.allowedCommands` allow-list. Unknown commands trigger a
 * modal confirmation; approvals are persisted to the user's global settings
 * and denials skip starting the LSP.
 *
 * Reads and writes stay at the user-global scope so a hostile workspace
 * cannot pre-approve its own command — the setting is also listed in
 * `capabilities.untrustedWorkspaces.restrictedConfigurations`. The
 * `SERVER_PATH_DEV` env override is a maintainer dev escape hatch and
 * bypasses the check entirely.
 */
export async function ensureCommandAllowed(
  cmd: string,
  outputChannel: LogOutputChannel,
): Promise<boolean> {
  if (process.env.SERVER_PATH_DEV) return true;

  // Only trust the user-global value — workspace overrides of the allow-list
  // itself are ignored so a hostile workspace can't self-approve.
  const conf = workspace.getConfiguration("oxc");
  const allowed = conf.inspect<string[]>("allowedCommands")?.globalValue ?? [];
  if (allowed.includes(cmd)) return true;

  const answer = await window.showWarningMessage(
    "Oxc wants to run a shell command that is not on your allow-list. " +
      `Only allow if you trust the command: "${cmd}".`,
    "Allow",
    "Deny",
  );
  if (answer !== "Allow") {
    outputChannel.warn(`Refused to run unapproved command: ${cmd}`);
    return false;
  }

  await conf.update("allowedCommands", [...allowed, cmd], ConfigurationTarget.Global);
  outputChannel.info(`Added "${cmd}" to oxc.allowedCommands.`);
  return true;
}

export function onClientNotification(params: ShowMessageParams, outputChannel: LogOutputChannel) {
  switch (params.type) {
    case MessageType.Debug:
      outputChannel.debug(params.message);
      break;
    case MessageType.Log:
      outputChannel.info(params.message);
      break;
    case MessageType.Info:
      window.showInformationMessage(params.message);
      break;
    case MessageType.Warning:
      window.showWarningMessage(params.message);
      break;
    case MessageType.Error:
      window.showErrorMessage(params.message);
      break;
    default:
      outputChannel.info(params.message);
  }
}
