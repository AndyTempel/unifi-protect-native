/* Copyright(C) 2019-2025, HJD (https://github.com/hjdhjd). All rights reserved.
 *
 * runtime.ts: Runtime detection helpers for UniFi Protect.
 */

/**
 * Known runtime environments where the UniFi Protect client can execute.
 */
export enum RuntimePlatform {

  NODE = "node",
  REACT_NATIVE = "react-native",
  WEB = "web",
  UNKNOWN = "unknown"
}

export interface RuntimeInfo {

  platform: RuntimePlatform;
  isNode: boolean;
  isReactNative: boolean;
  isWeb: boolean;
}

const runtimeInfo: RuntimeInfo = detectRuntime();

/**
 * Detect the current runtime environment once per process.
 */
function detectRuntime(): RuntimeInfo {

  const isReactNative = typeof globalThis === "object" &&
    typeof (globalThis as { navigator?: { product?: string } }).navigator === "object" &&
    ((globalThis as { navigator?: { product?: string } }).navigator?.product === "ReactNative");

  const isNode = typeof process !== "undefined" &&
    typeof process.release === "object" &&
    process.release?.name === "node";

  const isWeb = !isNode && (typeof window !== "undefined");

  if(isReactNative) {

    return {
      platform: RuntimePlatform.REACT_NATIVE,
      isNode,
      isReactNative,
      isWeb
    };
  }

  if(isNode) {

    return {
      platform: RuntimePlatform.NODE,
      isNode,
      isReactNative,
      isWeb
    };
  }

  if(isWeb) {

    return {
      platform: RuntimePlatform.WEB,
      isNode,
      isReactNative,
      isWeb
    };
  }

  return {
    platform: RuntimePlatform.UNKNOWN,
    isNode,
    isReactNative,
    isWeb
  };
}

/**
 * Retrieve the cached runtime information.
 */
export const getRuntimeInfo = (): RuntimeInfo => runtimeInfo;

/**
 * Convenience helpers for the active runtime.
 */
export const isNodeRuntime = (): boolean => runtimeInfo.isNode;
export const isReactNativeRuntime = (): boolean => runtimeInfo.isReactNative;
