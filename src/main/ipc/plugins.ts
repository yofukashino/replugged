/*
IPC events:
- REPLUGGED_LIST_PLUGINS: returns an array of the names of all installed plugins
- REPLUGGED_UNINSTALL_PLUGIN: returns whether a plugin by the provided name was successfully uninstalled
*/

import { extname, join, sep } from "path";
import { ipcMain, shell } from "electron";
import { RepluggedIpcChannels, type RepluggedPlugin } from "../../types";
import { plugin } from "../../types/addon";
import {
  type Dirent,
  type Stats,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { CONFIG_PATHS, extractAddon } from "src/util.mjs";
import { getSetting } from "./settings";

let PluginIpcMappings: Record<string, Record<string, string>>;

const PLUGINS_DIR = CONFIG_PATHS.plugins;
const TEMP_PLUGINS_DIR = CONFIG_PATHS.temp_plugins;

export const isFileAPlugin = (f: Dirent | Stats, name: string): boolean => {
  return f.isDirectory() || (f.isFile() && extname(name) === ".asar");
};

function getPlugin(pluginName: string): RepluggedPlugin {
  const isAsar = pluginName.includes(".asar");
  const pluginPath = join(PLUGINS_DIR, pluginName);
  const realPluginPath = isAsar
    ? join(TEMP_PLUGINS_DIR, pluginName.replace(/\.asar$/, ""))
    : pluginPath; // Remove ".asar" from the directory name
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
  try {
    const hasCSS = cssPath && statSync(join(realPluginPath, cssPath));

    if (hasCSS) data.hasCSS = true;
  } catch {
    data.hasCSS = false;
  }

  return data;
}

function listPlugins(): RepluggedPlugin[] {
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
    })
    .filter(Boolean) as Dirent[];

  for (const pluginDir of pluginDirs) {
    try {
      plugins.push(getPlugin(pluginDir.name));
    } catch (e) {
      console.error(`Invalid plugin: ${pluginDir.name}`);
      console.error(e);
    }
  }
  console.log("gg");
  return plugins;
}

function mapPluginNatives() {
  const disabled = getSetting<string[]>("plugins", "disabled", []);
  const plugins = listPlugins();

  PluginIpcMappings ??= plugins.reduce((acc: Record<string, Record<string, string>>, plugin) => {
    if (!plugin.manifest.native || disabled.includes(plugin.manifest.id)) return acc;

    const isAsar = plugin.path.includes(".asar");
    const pluginPath = join(PLUGINS_DIR, plugin.path);
    const realPluginPath = isAsar
      ? join(TEMP_PLUGINS_DIR, plugin.path.replace(/\.asar$/, ""))
      : pluginPath; // Remove ".asar" from the directory name

    const nativePath = join(realPluginPath, plugin.manifest.native);

    if (!nativePath.startsWith(`${PLUGINS_DIR}${sep}`)) {
      // Ensure file changes are restricted to the base path
      throw new Error("Invalid plugin name");
    }
    const entries = Object.entries(require(nativePath));
    if (!entries.length) return acc;

    const mappings = (acc[plugin.manifest.id] = {} as Record<string, string>);

    for (const [methodName, method] of entries) {
      const key = `RPPlugin-Native_${plugin.manifest.id}_${methodName}`;
      ipcMain.handle(key, (_, ...args) => (method as (...args: unknown[]) => unknown)(...args));
      mappings[methodName] = key;
    }
    return acc;
  }, {});
}
mapPluginNatives();
ipcMain.handle(
  RepluggedIpcChannels.GET_PLUGIN,
  (_, pluginName: string): RepluggedPlugin | undefined => {
    try {
      return getPlugin(pluginName);
    } catch {}
  },
);

ipcMain.on(RepluggedIpcChannels.LIST_PLUGINS, (event) => {
  event.returnValue = listPlugins();
});

ipcMain.on(RepluggedIpcChannels.LIST_PLUGINS_PLAINTEXT_PATCHES, (event) => {
  const disabled = getSetting<string[]>("plugins", "disabled", []);
  const plugins = listPlugins();

  const pluginPlaintextPatches = plugins.reduce((acc: Record<string, string>, p) => {
    if (!p.manifest.plaintextPatches || disabled.includes(p.manifest.id)) {
      return acc;
    }
    const isAsar = p.path.includes(".asar");
    const pluginPath = join(PLUGINS_DIR, p.path);
    const realPluginPath = isAsar
      ? join(TEMP_PLUGINS_DIR, p.path.replace(/\.asar$/, ""))
      : pluginPath; // Remove ".asar" from the directory name

    const plaintextPatchPath = join(realPluginPath, p.manifest.plaintextPatches);
    if (!plaintextPatchPath.startsWith(`${realPluginPath}${sep}`)) {
      // Ensure file changes are restricted to the base path
      throw new Error("Invalid plugin name");
    }

    acc[p.manifest.id] = readFileSync(plaintextPatchPath, "utf-8");
    return acc;
  }, {});
  event.returnValue = pluginPlaintextPatches;
});

ipcMain.on(RepluggedIpcChannels.LIST_PLUGINS_NATIVE, (event) => {
  event.returnValue = PluginIpcMappings;
});

ipcMain.handle(RepluggedIpcChannels.UNINSTALL_PLUGIN, (_, pluginName: string) => {
  const isAsar = pluginName.includes(".asar");
  const pluginPath = join(PLUGINS_DIR, pluginName);
  const realPluginPath = isAsar
    ? join(TEMP_PLUGINS_DIR, pluginName.replace(".asar", ""))
    : pluginPath; // Remove ".asar" from the directory name

  if (!realPluginPath.startsWith(`${isAsar ? TEMP_PLUGINS_DIR : PLUGINS_DIR}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid plugin name");
  }

  if (isAsar) {
    unlinkSync(pluginPath);
    rmdirSync(realPluginPath, { recursive: true });
  } else rmdirSync(pluginPath, { recursive: true });
});

ipcMain.on(RepluggedIpcChannels.OPEN_PLUGINS_FOLDER, () => shell.openPath(PLUGINS_DIR));

ipcMain.handle(RepluggedIpcChannels.CLEAR_TEMP_PLUGIN, () => {
  try {
    rmdirSync(TEMP_PLUGINS_DIR, { recursive: true });
  } catch {}
});
