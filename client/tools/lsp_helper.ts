import { LogOutputChannel, window } from "vscode";
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
