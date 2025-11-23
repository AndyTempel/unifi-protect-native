/* Copyright(C) 2019-2025, HJD (https://github.com/hjdhjd). All rights reserved.
 *
 * index.ts: UniFi Protect API registration.
 */
/** @internal */

import { Buffer } from "buffer";

// Ensure Buffer is available in Expo / React Native runtimes.
const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
globalWithBuffer.Buffer ??= Buffer;

// Export our API.
export * from "./protect-api.js";
export type { ProtectLivestream } from "./protect-api-livestream.js";
export { ProtectApiEvents, ProtectEventPacket } from "./protect-api-events.js";
export * from "./protect-logging.js";
export * from "./protect-types.js";
