/*
IPC events:
- REPLUGGED_LIST_PLUGINS: returns an array of the names of all installed plugins
- REPLUGGED_UNINSTALL_PLUGIN: returns whether a plugin by the provided name was successfully uninstalled
*/

import { rm, unlink } from "fs/promises";
import { extname, join, sep } from "path";
import { ipcMain, shell } from "electron";
import { type Dirent, type Stats, readFileSync, readdirSync, readlinkSync, statSync } from "fs";
import { RepluggedIpcChannels, type RepluggedPlugin } from "../../types";
import { plugin } from "../../types/addon";
import type { UnknownFunction } from "../../types/util";

import { CONFIG_PATHS, extractAddon } from "src/util.mjs";

import logger from "../logger";

const PLUGINS_DIR = CONFIG_PATHS.plugins;
const TMP_DIR = CONFIG_PATHS.temp_addons;

const PluginIPC: Record<string, Record<string, string> | undefined> = {};

export const isFileAPlugin = (f: Dirent | Stats, name: string): boolean => {
  return f.isDirectory() || (f.isFile() && extname(name) === ".asar");
};

function getPlugin(pluginName: string): RepluggedPlugin {
  const isAsar = pluginName.includes(".asar");
  const pluginPath = join(PLUGINS_DIR, pluginName);
  const realPluginPath = isAsar ? join(TMP_DIR, pluginName.replace(/\.asar$/, "")) : pluginPath; // Remove ".asar" from the directory name
  if (isAsar) extractAddon(pluginPath, realPluginPath);

  const manifestPath = join(realPluginPath, "manifest.json");
  if (!manifestPath.startsWith(`${realPluginPath}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid plugin name");
  }

  const manifest: unknown = JSON.parse(
    readFileSync(manifestPath, {
      encoding: "utf-8",
    }),
  );

  const data = {
    path: pluginName,
    manifest: plugin.parse(manifest),
    hasCSS: false,
  };

  const cssPath = data.manifest.renderer?.replace(/\.js$/, ".css");

  let hasCSS = false;

  if (cssPath) {
    try {
      statSync(join(PLUGINS_DIR, pluginName, cssPath));
      hasCSS = true;
    } catch {
      hasCSS = false;
    }
  }

  if (hasCSS) data.hasCSS = true;

  return data;
}

ipcMain.on(RepluggedIpcChannels.GET_PLUGIN, (event, pluginName: string) => {
  try {
    event.returnValue = getPlugin(pluginName);
  } catch {}
});

ipcMain.on(RepluggedIpcChannels.LIST_PLUGINS, (event) => {
  const plugins = [];

  const pluginDirs = readdirSync(PLUGINS_DIR, {
    withFileTypes: true,
  })
    .map((f) => {
      if (isFileAPlugin(f, f.name)) return f;
      if (f.isSymbolicLink()) {
        try {
          const actualPath = readlinkSync(join(PLUGINS_DIR, f.name));
          const actualFile = statSync(actualPath);

          if (isFileAPlugin(actualFile, actualPath)) return f;
        } catch {}
      }

      return void 0;
    })
    .filter(Boolean) as Dirent[];

  for (const pluginDir of pluginDirs) {
    try {
      plugins.push(getPlugin(pluginDir.name));
    } catch (e) {
      logger.error(`Invalid plugin: ${pluginDir.name}`);
      logger.error(e);
    }
  }

  event.returnValue = plugins;
});

ipcMain.on(RepluggedIpcChannels.REGISTER_PLUGIN_NATIVE, (event, pluginName: string) => {
  const plugin = getPlugin(pluginName);

  if (!plugin.manifest.native) {
    event.returnValue = null;
    return;
  }

  const path = join(CONFIG_PATHS.plugins, pluginName, plugin.manifest.native);
  if (!path.startsWith(`${PLUGINS_DIR}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid plugin name");
  }
  if (PluginIPC[plugin.manifest.id]) {
    event.returnValue = PluginIPC[plugin.manifest.id];
    return;
  }

  try {
    const entries = Object.entries<UnknownFunction>(
      require(path) as Record<string, UnknownFunction>,
    );
    if (!entries.length) {
      PluginIPC[plugin.manifest.id] = {};
      event.returnValue = {};
    }

    const mappings: Record<string, string> = {};

    for (const [methodName, method] of entries) {
      if (typeof method !== "function") continue;
      const key = `Replugged_Plugin_Native_[${plugin.manifest.id}]_${methodName}`;
      ipcMain.handle(key, async (_, ...args: unknown[]) => await method(...args));
      mappings[methodName] = key;
    }
    PluginIPC[plugin.manifest.id] = mappings;
    event.returnValue = mappings;
  } catch (e) {
    logger.error(`Error Loading Plugin Native`, plugin.manifest, e);
  }
});

ipcMain.handle(RepluggedIpcChannels.UNINSTALL_PLUGIN, async (_, pluginName: string) => {
  const isAsar = pluginName.includes(".asar");
  const pluginPath = join(PLUGINS_DIR, pluginName);
  const realPluginPath = isAsar ? join(TMP_DIR, pluginName.replace(/\.asar$/, "")) : pluginPath; // Remove ".asar" from the directory name

  if (!realPluginPath.startsWith(`${isAsar ? TMP_DIR : PLUGINS_DIR}${sep}`)) {
    throw new Error("Invalid plugin name");
  }

  if (isAsar) {
    await unlink(pluginPath);
    await rm(realPluginPath, { recursive: true });
  } else await rm(pluginPath, { recursive: true });
});

ipcMain.on(RepluggedIpcChannels.OPEN_PLUGINS_FOLDER, () => shell.openPath(PLUGINS_DIR));

ipcMain.on(RepluggedIpcChannels.GET_PLUGIN_PLAINTEXT_PATCHES, (event, pluginName: string) => {
  const plugin = getPlugin(pluginName);
  if (!plugin.manifest.plaintextPatches) return;

  const path = join(CONFIG_PATHS.plugins, pluginName, plugin.manifest.plaintextPatches);
  if (!path.startsWith(`${PLUGINS_DIR}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid plugin name");
  }

  event.returnValue = readFileSync(path, "utf-8");
});

ipcMain.on(RepluggedIpcChannels.OPEN_PLUGINS_FOLDER, () => shell.openPath(PLUGINS_DIR));

ipcMain.on(RepluggedIpcChannels.GET_PLUGIN_PLAINTEXT_PATCHES, (event, pluginName: string) => {
  const plugin = getPlugin(pluginName);
  if (!plugin.manifest.plaintextPatches) return;

  const path = join(CONFIG_PATHS.plugins, pluginName, plugin.manifest.plaintextPatches);
  if (!path.startsWith(`${PLUGINS_DIR}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid plugin name");
  }

  event.returnValue = readFileSync(path, "utf-8");
});
