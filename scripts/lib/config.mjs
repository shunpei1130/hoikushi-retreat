import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const CONFIG_PATH = fileURLToPath(new URL("../../site.config.json", import.meta.url));

export async function loadConfig(path = CONFIG_PATH) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

export function getByPath(object, path) {
  return path.split(".").reduce((value, key) => {
    if (value === null || value === undefined) return undefined;
    return value[key];
  }, object);
}

export function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function normalizeOrigin(origin) {
  if (!isFilled(origin)) return null;
  return String(origin).trim().replace(/\/+$/, "");
}
