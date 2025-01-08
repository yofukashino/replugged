import {
  type BrowserWindowConstructorOptions,
  contextBridge,
  ipcRenderer,
  webFrame,
} from "electron";
import https from "https";

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

let version = "";
void ipcRenderer.invoke(RepluggedIpcChannels.GET_REPLUGGED_VERSION).then((v) => {
  version = v;
});

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
          throw new Error(err.message.split(": Error: ")[1]);
        }
      };
    }
    pluginNatives[pluginId] = map;
  }
  return Object.entries(pluginNatives);
};

const RepluggedNative = {
  themes: {
    list: (): RepluggedTheme[] => ipcRenderer.sendSync(RepluggedIpcChannels.LIST_THEMES),
    uninstall: (themeName: string) =>
      ipcRenderer.invoke(RepluggedIpcChannels.UNINSTALL_THEME, themeName), // whether theme was successfully uninstalled
    openFolder: () => ipcRenderer.send(RepluggedIpcChannels.OPEN_THEMES_FOLDER),
  },

  plugins: {
    get: async (pluginPath: string): Promise<RepluggedPlugin | undefined> =>
      ipcRenderer.invoke(RepluggedIpcChannels.GET_PLUGIN, pluginPath),
    list: (): RepluggedPlugin[] => ipcRenderer.sendSync(RepluggedIpcChannels.LIST_PLUGINS),
    resolvePlaintextPath: (id: string): string =>
      ipcRenderer.sendSync(RepluggedIpcChannels.RESOLVE_PLUGINS_PLAINTEXT_PATH, id),
    readPlaintextPath: (id: string): string =>
      ipcRenderer.sendSync(RepluggedIpcChannels.READ_PLUGINS_PLAINTEXT, id),
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
  },

  settings: {
    get: (namespace: string, key: string) =>
      ipcRenderer.invoke(RepluggedIpcChannels.GET_SETTING, namespace, key),
    set: (namespace: string, key: string, value: unknown) =>
      ipcRenderer.invoke(RepluggedIpcChannels.SET_SETTING, namespace, key, value), // invoke or send?
    has: (namespace: string, key: string) =>
      ipcRenderer.invoke(RepluggedIpcChannels.HAS_SETTING, namespace, key),
    delete: (namespace: string, key: string) =>
      ipcRenderer.invoke(RepluggedIpcChannels.DELETE_SETTING, namespace, key),
    all: (namespace: string) =>
      ipcRenderer.invoke(RepluggedIpcChannels.GET_ALL_SETTINGS, namespace),
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
  getWindows: async (): Promise<unknown> => ipcRenderer.invoke("windows"),
  https,

  // @todo We probably want to move these somewhere else, but I'm putting them here for now because I'm too lazy to set anything else up
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
