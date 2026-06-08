import type { RPCSchema } from "electrobun/bun";

export type WindowRPCType = {
  bun: RPCSchema<{
    requests: {};
    messages: {
      closeWindow: undefined;
      minimizeWindow: undefined;
      maximizeWindow: undefined;
    };
  }>;
  webview: RPCSchema<{
    requests: {};
    messages: {};
  }>;
};
