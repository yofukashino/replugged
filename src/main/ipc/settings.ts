<<<<<<< HEAD
=======
import { readFile, writeFile } from "fs/promises";
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada
import { resolve, sep } from "path";
import { ipcMain, shell } from "electron";
import { RepluggedIpcChannels } from "../../types";
import type {
  SettingsMap,
  SettingsTransactionHandler,
  TransactionHandler,
} from "../../types/settings";
import { CONFIG_PATHS } from "src/util.mjs";
import { readFileSync, writeFileSync } from "fs";

const SETTINGS_DIR = CONFIG_PATHS.settings;

export function getSettingsPath(namespace: string): string {
  const resolved = resolve(SETTINGS_DIR, `${namespace}.json`);
<<<<<<< HEAD
=======
  console.log(resolved, SETTINGS_DIR, resolved.startsWith(SETTINGS_DIR));
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada
  if (!resolved.startsWith(`${SETTINGS_DIR}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid namespace");
  }
  return resolved;
}

<<<<<<< HEAD
function readSettings(namespace: string): Map<string, unknown> {
  const path = getSettingsPath(namespace);
  try {
    const data = readFileSync(path, "utf8");
=======
async function readSettings(namespace: string): Promise<Map<string, unknown>> {
  const path = getSettingsPath(namespace);
  try {
    const data = await readFile(path, "utf8");
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada
    return new Map(Object.entries(JSON.parse(data)));
  } catch {
    return new Map();
  }
}

<<<<<<< HEAD
function writeSettings(namespace: string, settings: SettingsMap): void {
  writeFileSync(
=======
function writeSettings(namespace: string, settings: SettingsMap): Promise<void> {
  return writeFile(
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada
    getSettingsPath(namespace),
    JSON.stringify(Object.fromEntries(settings.entries()), null, 2),
    "utf8",
  );
}

<<<<<<< HEAD
const locks: Record<string, unknown | undefined> = {};
=======
const locks: Record<string, Promise<unknown> | undefined> = {};
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada

function transaction<T>(namespace: string, handler: TransactionHandler<T>): T {
  const result = handler();

  locks[namespace] = result;
  return result;
}

export function readTransaction<T>(namespace: string, handler: SettingsTransactionHandler<T>): T {
  return transaction(namespace, () => {
    const settings = readSettings(namespace);
    return handler(settings);
  });
}

<<<<<<< HEAD
export function writeTransaction<T>(namespace: string, handler: SettingsTransactionHandler<T>): T {
  return transaction(namespace, () => {
    const postHandlerTransform: Array<(settings: SettingsMap) => void | void> = [];

    const settings = readSettings(namespace);
=======
export async function writeTransaction<T>(
  namespace: string,
  handler: SettingsTransactionHandler<T>,
): Promise<T> {
  return transaction(namespace, async () => {
    const postHandlerTransform: Array<(settings: SettingsMap) => void | Promise<void>> = [];

    const settings = await readSettings(namespace);
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada
    if (namespace.toLowerCase() === "dev.replugged.settings") {
      // Prevent the "apiUrl" setting from changing
      const originalValue = settings.get("apiUrl");
      postHandlerTransform.push((settings) => {
        if (originalValue) {
          settings.set("apiUrl", originalValue);
        } else {
          settings.delete("apiUrl");
        }
      });
    }

<<<<<<< HEAD
    const res = handler(settings);

    for (const transform of postHandlerTransform) {
      transform(settings);
    }

    writeSettings(namespace, settings);
=======
    const res = await handler(settings);

    for (const transform of postHandlerTransform) {
      await transform(settings);
    }

    await writeSettings(namespace, settings);
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada
    return res;
  });
}

export function getSetting<T>(namespace: string, key: string, fallback: T): T;
export function getSetting<T>(namespace: string, key: string, fallback?: T): T | undefined;
export function getSetting<T>(namespace: string, key: string, fallback?: T): T | undefined {
  const setting = readTransaction(namespace, (settings) => settings.get(key)) as T;
  return setting ?? fallback;
}

ipcMain.handle(RepluggedIpcChannels.GET_SETTING, (_, namespace: string, key: string) =>
  getSetting(namespace, key),
);

ipcMain.handle(RepluggedIpcChannels.HAS_SETTING, (_, namespace: string, key: string) =>
  readTransaction(namespace, (settings) => settings.has(key)),
);

ipcMain.handle(
  RepluggedIpcChannels.SET_SETTING,
  (_, namespace: string, key: string, value: unknown) =>
    writeTransaction(namespace, (settings) => settings.set(key, value)),
);

ipcMain.handle(RepluggedIpcChannels.DELETE_SETTING, (_, namespace: string, key: string) =>
  writeTransaction(namespace, (settings) => settings.delete(key)),
);

ipcMain.handle(RepluggedIpcChannels.GET_ALL_SETTINGS, (_, namespace: string) =>
  readTransaction(namespace, (settings) => Object.fromEntries(settings.entries())),
);

ipcMain.on(RepluggedIpcChannels.OPEN_SETTINGS_FOLDER, () => shell.openPath(SETTINGS_DIR));
