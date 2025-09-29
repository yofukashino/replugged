import { type MessageBoxOptions, app, dialog, ipcMain } from "electron";
import { RepluggedIpcChannels, type RepluggedPlugin } from "src/types";
import { getSetting, writeTransaction } from "./settings";
import { getPlugin } from "./plugins";

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

function writeIpcSetting(key: string, value: unknown): unknown {
  const pluginIpc = getSetting<Record<string, unknown>>("dev.replugged.Settings", "pluginIpc");
  return writeTransaction("dev.replugged.Settings", (settings) =>
    settings.set("pluginIpc", { ...pluginIpc, [key]: value }),
  );
}

async function queryUser(
  key: keyof typeof PluginIpcSettings,
  value: string | boolean | string[],
  extraProps?: Partial<MessageBoxOptions>,
): Promise<unknown> {
  const messageProps = PluginIpcSettings[key];
  const res = await dialog.showMessageBox({
    ...(extraProps ?? {}),
    ...messageProps,
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
  if (!value) return writeIpcSetting("enabled", false);
  await queryUser("enabled", true);
});

ipcMain.handle(
  RepluggedIpcChannels.SET_PLUGIN_IPC_MODE,
  async (_, value: "blacklist" | "whitelist" | "allowed") => {
    await queryUser("mode", value, {
      detail: `Current Value: "${value}", Default Value: "whitelist"`,
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
      const currentSettings =
        getSetting<Record<"blacklist" | "whitelist", string[]>>(
          "dev.replugged.Settings",
          "pluginIpc",
        )?.[type] ?? [];
      const removed = currentSettings.filter((c) => !value.includes(c));
      const added = value.filter((c) => !currentSettings.includes(c));
      return { added, removed };
    };

    const mapDetails = (added: string[], removed: string[]): string =>
      `Added Plugins: ${added
        .map((p) => getPlugin(p).manifest.name)
        .filter(Boolean)
        .join(", ")}\n\nRemoved Plugins: ${removed
        .map((p) => getPlugin(p).manifest.name)
        .filter(Boolean)
        .join(", ")}`;

    switch (type) {
      case "blacklist": {
        const { added, removed } = getChanges("blacklist", value);
        await queryUser(
          "blacklist",
          value.filter((c) => getPlugin(c) as RepluggedPlugin | undefined),
          {
            detail: mapDetails(added, removed),
          },
        );
        break;
      }
      case "whitelist": {
        const { added, removed } = getChanges("whitelist", value);
        await queryUser("whitelist", value, {
          detail: mapDetails(added, removed),
        });
      }
    }
  },
);
