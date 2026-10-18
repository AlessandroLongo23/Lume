import type { Json } from './types';

export type JsonObject = { [key: string]: Json | undefined };

/** True when a JSON column holds an object (not an array, scalar or null). */
export function isJsonObject(value: Json | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
