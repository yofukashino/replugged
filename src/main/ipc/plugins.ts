/*
IPC events:
- REPLUGGED_LIST_PLUGINS: returns an array of the names of all installed plugins
- REPLUGGED_UNINSTALL_PLUGIN: returns whether a plugin by the provided name was successfully uninstalled
*/
import { readFileSync, readdirSync, readlinkSync, rmSync, statSync } from "fs";
import { extname, join, sep } from "path";
import { ipcMain, shell } from "electron";
import { RepluggedIpcChannels, type RepluggedPlugin } from "../../types";
import { plugin } from "../../types/addon";
// eslint-disable-next-line no-duplicate-imports
import type { Dirent, Stats } from "fs";
import { CONFIG_PATHS } from "src/util.mjs";
import { getSetting } from "./settings";
const PLUGINS_DIR = CONFIG_PATHS.plugins;

export const isFileAPlugin = (f: Dirent | Stats, name: string): boolean => {
  return f.isDirectory() || (f.isFile() && extname(name) === ".asar");
};

function getPlugin(pluginName: string): RepluggedPlugin {
  const manifestPath = join(PLUGINS_DIR, pluginName, "manifest.json");
  if (!manifestPath.startsWith(`${PLUGINS_DIR}${sep}`)) {
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
  const hasCSS = cssPath && statSync(join(PLUGINS_DIR, pluginName, cssPath));

  if (hasCSS) data.hasCSS = true;

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
        const actualPath = readlinkSync(join(PLUGINS_DIR, f.name));
        const actualFile = statSync(actualPath);
        if (isFileAPlugin(actualFile, actualPath)) return f;
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

  return plugins;
}
ipcMain.handle(
  RepluggedIpcChannels.GET_PLUGIN,
  (_, pluginName: string): RepluggedPlugin | undefined => {
    try {
      return getPlugin(pluginName);
    } catch {}
  },
);

ipcMain.on(RepluggedIpcChannels.LIST_PLUGINS, (): RepluggedPlugin[] => {
  return listPlugins();
});

ipcMain.on(RepluggedIpcChannels.LIST_PLUGINS_PLAINTEXT_PATCHES, (): Record<string, string> => {
  const disabled = getSetting<string[]>("dev.replugged.Settings", "disabled", []);
  const plugins = listPlugins();
  const pluginPlaintextPatches = plugins.reduce((acc: Record<string, string>, p) => {
    if (!p.manifest.plaintextPatches || disabled.includes(p.manifest.id)) {
      return acc;
    }
    const plaintextPatchPath = join(join(PLUGINS_DIR, p.path), p.manifest.plaintextPatches);
    if (!plaintextPatchPath.startsWith(`${PLUGINS_DIR}${sep}`)) {
      // Ensure file changes are restricted to the base path
      throw new Error("Invalid plugin name");
    }

    acc[p.manifest.id] = readFileSync(plaintextPatchPath, "utf-8");
    return acc;
  }, {});

  return pluginPlaintextPatches;
});

ipcMain.handle(RepluggedIpcChannels.UNINSTALL_PLUGIN, (_, pluginName: string) => {
  const pluginPath = join(PLUGINS_DIR, pluginName);
  if (!pluginPath.startsWith(`${PLUGINS_DIR}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid plugin name");
  }

  rmSync(pluginPath, {
    recursive: true,
    force: true,
  });
});

ipcMain.on(RepluggedIpcChannels.OPEN_PLUGINS_FOLDER, () => shell.openPath(PLUGINS_DIR));
