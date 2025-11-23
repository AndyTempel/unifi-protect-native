/* Copyright(C) 2019-2025, HJD (https://github.com/hjdhjd). All rights reserved.
 *
 * index.ts: Platform adapter registry.
 */
import { nodeAdapter } from "./node-adapter.js";
import { reactNativeAdapter } from "./react-native-adapter.js";
import { RuntimePlatform, getRuntimeInfo } from "./runtime.js";
import type { PlatformAdapter } from "./types.js";

let cachedAdapter: PlatformAdapter | undefined;

function selectAdapter(): PlatformAdapter {

  const runtime = getRuntimeInfo();

  if(runtime.platform === RuntimePlatform.REACT_NATIVE) {

    return reactNativeAdapter;
  }

  return nodeAdapter;
}

export const getPlatformAdapter = (): PlatformAdapter => {

  cachedAdapter ??= selectAdapter();

  return cachedAdapter;
};

export { RuntimePlatform } from "./runtime.js";
export type { PlatformAdapter } from "./types.js";
