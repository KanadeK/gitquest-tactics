import { executeCommand } from "../core/engine";
import type { CommandKind, GitState } from "../core/model";

self.onmessage = (
  event: MessageEvent<{
    command: string;
    state: GitState;
    allowed: CommandKind[];
  }>,
) => {
  self.postMessage(
    executeCommand(event.data.command, event.data.state, event.data.allowed),
  );
};
