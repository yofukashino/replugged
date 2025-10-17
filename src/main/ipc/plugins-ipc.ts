import { type MessageBoxOptions, app, dialog, ipcMain } from "electron";
import { RepluggedIpcChannels, type RepluggedPlugin } from "src/types";
import { getSetting, writeTransaction } from "./settings";
import { getPlugin, listPlugin } from "./plugins";
import { join, sep } from "path";
import { CONFIG_PATHS } from "src/util.mjs";

// Maybe move the settings to each of its seperate key?
interface IpcSettings {
  enabled?: boolean;
  mode?: "whitelist" | "blacklist" | "allowed";
  blacklist?: string[];
  whitelist?: string[];
}

const PLUGINS_DIR = CONFIG_PATHS.plugins;

const PluginIpcSettings = {
  enabled: {
    title: "Enabling Plugin IPC, Are you sure?",
    message:
      "Enabling this gives plugins full access to your PC, not just Discord. This is dangerous and not recommended. Continue only if you understand the risks.",
  },
  mode: {
    title: "Change Plugin IPC Mode?",
    message:
      "This will affect how plugins are allowed to run and may impact security. Continue only if you understand the risks.",
  },
  blacklist: {
    title: "Modify Blacklist?",
    message:
      "Blacklisted plugins will be blocked from running, which may affect functionality if the plugin is required.",
  },
  whitelist: {
    title: "Modify Whitelist?",
    message:
      "Whitelisted plugins will be allowed to run, which may reduce security if the plugin is unsafe.",
  },
};

const currentSettings = getSetting<IpcSettings>("dev.replugged.Settings", "pluginIpc");

function isFiltered(id: string): boolean {
  switch (currentSettings?.mode) {
    case "allowed": {
      return false;
    }
    case "blacklist": {
      return Boolean(currentSettings.blacklist?.includes(id));
    }
    case "whitelist":
    default: {
      return !currentSettings?.whitelist?.includes(id);
    }
  }
}

function loadPluginIpc(): void {
  // TODO: store data from here for preload, maybe cache listPlugin?
  for (const plugin of listPlugin()) {
    if (!plugin.manifest.main || isFiltered(plugin.manifest.id)) continue;
    const mainPath = join(PLUGINS_DIR, plugin.path, plugin.manifest.main);
    if (!mainPath.startsWith(`${PLUGINS_DIR}${sep}`)) {
      // Ensure file changes are restricted to the base path
      throw new Error("Invalid plugin name");
    }
    require(mainPath);
  }
}

function writeIpcSetting(key: string, value: unknown): unknown {
  const pluginIpc = getSetting<IpcSettings>("dev.replugged.Settings", "pluginIpc");
  return writeTransaction("dev.replugged.Settings", (settings) =>
    settings.set("pluginIpc", {
      enabled: false,
      mode: "whitelist",
      blacklist: [],
      whitelist: [],
      ...pluginIpc,
      [key]: value,
    }),
  );
}

async function queryUser(
  key: keyof typeof PluginIpcSettings,
  value: string | boolean | string[],
  extraProps?: Partial<MessageBoxOptions>,
): Promise<unknown> {
  const messageProps = PluginIpcSettings[key];
  const res = await dialog.showMessageBox({
    ...messageProps,
    ...(extraProps ?? {}),
    type: "question",
    buttons: ["Cancel", "Confirm and restart"],
    noLink: true,
  });
  if (res.response !== 1) return;
  writeIpcSetting(key, value);
  app.relaunch();
  app.quit();
}

ipcMain.handle(RepluggedIpcChannels.SET_PLUGIN_IPC, async (_, value: boolean) => {
  await queryUser(
    "enabled",
    value,
    value
      ? undefined
      : {
          title: "Disabling Plugin IPC, Are you sure?",
          message:
            "Enabling this gives plugins full access to your PC, not just Discord. This is dangerous and not recommended. Continue only if you understand the risks.",
        },
  );
});

ipcMain.handle(
  RepluggedIpcChannels.SET_PLUGIN_IPC_MODE,
  async (_, value: "blacklist" | "whitelist" | "allowed") => {
    await queryUser("mode", value, {
      detail: `Current Value: ${value}, Default Value: whitelist`,
    });
  },
);

ipcMain.handle(
  RepluggedIpcChannels.SET_PLUGIN_IPC_LIST,
  async (_, type: "blacklist" | "whitelist", value: string[]) => {
    const getChanges = (
      type: "blacklist" | "whitelist",
      value: string[],
    ): { removed: string[]; added: string[] } => {
      // Should we use object instead of array?
      const currentSettings =
        getSetting<Record<"blacklist" | "whitelist", string[]>>(
          "dev.replugged.Settings",
          "pluginIpc",
        )?.[type] ?? [];

      const removed = currentSettings
        .filter((c) => !value.includes(c))
        .map((p) => getPlugin(p).manifest.name)
        .filter(Boolean);

      const added = value
        .filter((c) => !currentSettings.includes(c))
        .map((p) => getPlugin(p).manifest.name)
        .filter(Boolean);
      return { added, removed };
    };

    const mapDetails = (added: string[], removed: string[]): string =>
      `${added.length ? `Added Plugins: ${added.join(", ")}` : ""}${removed.length ? `\n\nRemoved Plugins: ${removed.join(", ")}` : ""}`;

    switch (type) {
      case "blacklist": {
        const { added, removed } = getChanges("blacklist", value);
        if (added.length || removed.length)
          await queryUser(
            "blacklist",
            // to remove plugins which are uninstalled
            // TODO: fix type?
            value.filter((c) => getPlugin(c) as RepluggedPlugin | undefined),
            {
              detail: mapDetails(added, removed),
            },
          );
        break;
      }
      case "whitelist": {
        const { added, removed } = getChanges("whitelist", value);

        if (added.length || removed.length)
          await queryUser(
            "whitelist",
            value.filter((c) => getPlugin(c) as RepluggedPlugin | undefined),
            {
              detail: mapDetails(added, removed),
            },
          );
      }
    }
  },
);

ipcMain.on(RepluggedIpcChannels.GET_PLUGIN_IPC_FILTERED, (event, id: string) => {
  event.returnValue = isFiltered(id);
});

ipcMain.on(RepluggedIpcChannels.GET_PLUGIN_IPC_ENABLED, (event) => {
  event.returnValue = currentSettings?.enabled;
});

// TODO: move this to the end, right before require(discordPath)
if (currentSettings?.enabled) loadPluginIpc();
