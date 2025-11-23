/* Copyright(C) 2019-2025, HJD (https://github.com/hjdhjd). All rights reserved.
 *
 * types.ts: Platform adapter type definitions.
 */
import type * as UndiciTypes from "undici";
import type { RuntimePlatform } from "./runtime.js";

export interface NetBindings {

  Agent: typeof UndiciTypes.Agent;
  Pool: typeof UndiciTypes.Pool;
  WebSocket: typeof UndiciTypes.WebSocket;
  errors: typeof UndiciTypes.errors;
  interceptors: typeof UndiciTypes.interceptors;
  request: typeof UndiciTypes.request;
}

export interface CompressionBindings {

  inflate: (input: Uint8Array) => Buffer;
}

export interface PlatformAdapter {

  id: RuntimePlatform;
  net: NetBindings;
  compression: CompressionBindings;
  isSupported: boolean;
  warning?: string;
}
