/* Copyright(C) 2019-2025, HJD (https://github.com/hjdhjd). All rights reserved.
 *
 * react-native-adapter.ts: React Native-specific platform bindings.
 */
import { RuntimePlatform } from "./runtime.js";
import type { PlatformAdapter } from "./types.js";

const notImplemented = (feature: string): never => {

  throw new Error("React Native adapter is not yet available for feature: " + feature + ".");
};

export const reactNativeAdapter: PlatformAdapter = {

  id: RuntimePlatform.REACT_NATIVE,
  net: {
    Agent: class ReactNativeAgent {} as never,
    Pool: class ReactNativePool {} as never,
    WebSocket: (globalThis.WebSocket ?? class ReactNativeWebSocket {}) as never,
    errors: {} as never,
    interceptors: {} as never,
    request: (() => notImplemented("request")) as never
  },
  compression: {

    inflate: (): never => notImplemented("inflate")
  },
  isSupported: false,
  warning: "React Native support is under active development."
};
