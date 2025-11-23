/* Copyright(C) 2019-2025, HJD (https://github.com/hjdhjd). All rights reserved.
 *
 * node-adapter.ts: Node.js-specific platform bindings.
 */
import zlib from "node:zlib";
import { Agent, Pool, WebSocket, errors, interceptors, request } from "undici";
import { RuntimePlatform } from "./runtime.js";
import type { PlatformAdapter } from "./types.js";

export const nodeAdapter: PlatformAdapter = {

  id: RuntimePlatform.NODE,
  net: {
    Agent,
    Pool,
    WebSocket,
    errors,
    interceptors,
    request
  },
  compression: {

    inflate: (input: Uint8Array): Buffer => zlib.inflateSync(input)
  },
  isSupported: true
};
