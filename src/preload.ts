import {
  type BrowserWindowConstructorOptions,
  contextBridge,
  ipcRenderer,
  webFrame,
  app,
} from "electron";

import { Logger } from "@logger";

import { RepluggedIpcChannels } from "./types";
// eslint-disable-next-line no-duplicate-imports -- these are only used for types, the other import is for the actual code
import type {
  CheckResultFailure,
  CheckResultSuccess,
  InstallResultFailure,
  InstallResultSuccess,
  InstallerType,
  PluginNativeMap,
  RepluggedPlugin,
  RepluggedTheme,
} from "./types";

const MainLogger = new Logger("Preload", "Backend", "#ea5a5a");

ipcRenderer.on(RepluggedIpcChannels.CONSOLE_LOG, (_event, ...args) => MainLogger.log(...args));
ipcRenderer.on(RepluggedIpcChannels.CONSOLE_WARN, (_event, ...args) => MainLogger.warn(...args));
ipcRenderer.on(RepluggedIpcChannels.CONSOLE_ERROR, (_event, ...args) => MainLogger.error(...args));

let version = "dev";

const mapNative = (
  nativeList: Record<string, Record<string, string>>,
): Array<[string, PluginNativeMap]> => {
  const pluginNatives = {} as Record<string, PluginNativeMap>;
  for (const pluginId in nativeList) {
    const methods = nativeList[pluginId];
    const map = {} as Record<string, (...args: unknown[]) => Promise<unknown>>;
    for (const methodName in methods) {
      map[methodName] = async (...args: unknown[]) => {
        try {
          return await ipcRenderer.invoke(methods[methodName], ...args);
        } catch (err) {
          throw new Error((err as { message: string }).message.split(": Error: ")[1]);
        }
      };
    }
    pluginNatives[pluginId] = map;
  }
  return Object.entries(pluginNatives);
};

const RepluggedNative = {
  themes: {
    list: async (): Promise<RepluggedTheme[]> =>
      ipcRenderer.invoke(RepluggedIpcChannels.LIST_THEMES),
    uninstall: async (themeName: string) =>
      ipcRenderer.invoke(RepluggedIpcChannels.UNINSTALL_THEME, themeName), // whether theme was successfully uninstalled
    openFolder: () => ipcRenderer.send(RepluggedIpcChannels.OPEN_THEMES_FOLDER),
  },

  plugins: {
    get: (pluginPath: string): RepluggedPlugin | undefined =>
      ipcRenderer.sendSync(RepluggedIpcChannels.GET_PLUGIN, pluginPath),
    list: (): RepluggedPlugin[] => ipcRenderer.sendSync(RepluggedIpcChannels.LIST_PLUGINS),
    readPlaintextPatch: (pluginPath: string): string | undefined =>
      ipcRenderer.sendSync(RepluggedIpcChannels.READ_PLUGIN_PLAINTEXT_PATCHES, pluginPath),
    listNative: (): Array<[string, PluginNativeMap]> =>
      mapNative(ipcRenderer.sendSync(RepluggedIpcChannels.LIST_PLUGINS_NATIVE)),
    uninstall: async (pluginPath: string): Promise<RepluggedPlugin> =>
      ipcRenderer.invoke(RepluggedIpcChannels.UNINSTALL_PLUGIN, pluginPath),
    openFolder: () => ipcRenderer.send(RepluggedIpcChannels.OPEN_PLUGINS_FOLDER),
  },

  updater: {
    check: async (
      type: string,
      identifier: string,
      id: string,
    ): Promise<CheckResultSuccess | CheckResultFailure> =>
      ipcRenderer.invoke(RepluggedIpcChannels.GET_ADDON_INFO, type, identifier, id),
    install: async (
      type: InstallerType | "replugged",
      path: string,
      url: string,
      version: string,
    ): Promise<InstallResultSuccess | InstallResultFailure> =>
      ipcRenderer.invoke(RepluggedIpcChannels.INSTALL_ADDON, type, path, url, true, version),
  },

  installer: {
    getInfo: async (
      type: string,
      repo: string,
      id?: string,
    ): Promise<CheckResultSuccess | CheckResultFailure> =>
      ipcRenderer.invoke(RepluggedIpcChannels.GET_ADDON_INFO, type, repo, id),
    install: async (
      type: InstallerType,
      path: string,
      url: string,
      version: string,
    ): Promise<InstallResultSuccess | InstallResultFailure> =>
      ipcRenderer.invoke(RepluggedIpcChannels.INSTALL_ADDON, type, path, url, false, version),
  },

  quickCSS: {
    get: async () => ipcRenderer.invoke(RepluggedIpcChannels.GET_QUICK_CSS),
    save: (css: string) => ipcRenderer.send(RepluggedIpcChannels.SAVE_QUICK_CSS, css),
    openFolder: () => ipcRenderer.send(RepluggedIpcChannels.OPEN_QUICKCSS_FOLDER),
    addListener: (cb: () => void) => ipcRenderer.on(RepluggedIpcChannels.QUICK_CSS_CHANGED, cb),
    watch: () => ipcRenderer.invoke(RepluggedIpcChannels.WATCH_QUICK_CSS),
    unwatch: () => ipcRenderer.invoke(RepluggedIpcChannels.UNWATCH_QUICK_CSS),
  },

  settings: {
    get: (namespace: string, key: string) =>
      ipcRenderer.sendSync(RepluggedIpcChannels.GET_SETTING, namespace, key),
    set: (namespace: string, key: string, value: unknown) =>
      ipcRenderer.sendSync(RepluggedIpcChannels.SET_SETTING, namespace, key, value), // invoke or send?
    has: (namespace: string, key: string) =>
      ipcRenderer.sendSync(RepluggedIpcChannels.HAS_SETTING, namespace, key),
    delete: (namespace: string, key: string) =>
      ipcRenderer.sendSync(RepluggedIpcChannels.DELETE_SETTING, namespace, key),
    all: (namespace: string) =>
      ipcRenderer.sendSync(RepluggedIpcChannels.GET_ALL_SETTINGS, namespace),
    startTransaction: (namespace: string) =>
      ipcRenderer.invoke(RepluggedIpcChannels.START_SETTINGS_TRANSACTION, namespace),
    endTransaction: (namespace: string, settings: Record<string, unknown> | null) =>
      ipcRenderer.invoke(RepluggedIpcChannels.END_SETTINGS_TRANSACTION, namespace, settings),
    openFolder: () => ipcRenderer.send(RepluggedIpcChannels.OPEN_SETTINGS_FOLDER),
  },

  reactDevTools: {
    downloadExtension: (): Promise<void> =>
      ipcRenderer.invoke(RepluggedIpcChannels.DOWNLOAD_REACT_DEVTOOLS),
  },

  getVersion: () => version,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  openBrowserWindow: (opts: BrowserWindowConstructorOptions) => {}, // later

  // @todo: We probably want to move these somewhere else, but I'm putting them here for now because I'm too lazy to set anything else up
  relaunch: () => ipcRenderer.send("RELAUNCH"),
};

export type RepluggedNativeType = typeof RepluggedNative;

contextBridge.exposeInMainWorld("RepluggedNative", RepluggedNative);

// webFrame.executeJavaScript returns a Promise, but we don't have any use for it
const renderer = ipcRenderer.sendSync(RepluggedIpcChannels.GET_REPLUGGED_RENDERER);

void webFrame.executeJavaScript(renderer);

try {
  window.addEventListener("beforeunload", () => {
    ipcRenderer.send(RepluggedIpcChannels.REGISTER_RELOAD);
  });
  // Get and execute Discord preload
  // If Discord ever sandboxes its preload, we'll have to eval the preload contents directlsy
  const preload = ipcRenderer.sendSync(RepluggedIpcChannels.GET_DISCORD_PRELOAD);
  if (preload) {
    require(preload);
  }
} catch (err) {
  console.error("Error loading original preload", err);
}
