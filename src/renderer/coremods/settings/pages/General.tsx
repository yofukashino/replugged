import { plugins } from "@replugged";
import { React, marginStyles, modal, toast } from "@common";
import { t as discordT, intl } from "@common/i18n";
import {
  Button,
  Checkbox,
  Divider,
  FieldSet,
  Flex,
  Modal,
  Notice,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TabBar,
  Text,
  TextInput,
} from "@components";
import { WEBSITE_URL } from "src/constants";
import * as QuickCSS from "src/renderer/managers/quick-css";
import { generalSettings } from "src/renderer/managers/settings";
import { t } from "src/renderer/modules/i18n";
import { useSetting, useSettingArray } from "src/renderer/util";
import { BACKGROUND_MATERIALS, VIBRANCY_SELECT_OPTIONS } from "src/types";

import "./General.css";
import type { RenderModalProps } from "discord-client-types/discord_app/design/web";

const konamiCode = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

function reload(): void {
  setTimeout(() => window.location.reload(), 250);
}

function relaunch(): void {
  setTimeout(() => window.DiscordNative.app.relaunch(), 250);
}

function restartModal(doRelaunch = false, onConfirm?: () => void, onCancel?: () => void): void {
  const restart = doRelaunch ? relaunch : reload;
  void modal
    .confirm({
      title: intl.string(t.REPLUGGED_SETTINGS_RESTART_TITLE),
      body: intl.string(t.REPLUGGED_SETTINGS_RESTART),
      confirmText: doRelaunch
        ? intl.string(discordT.BUNDLE_READY_RESTART)
        : intl.string(discordT.ERRORS_RELOAD),
      cancelText: intl.string(discordT.CANCEL),
      confirmColor: Button.Colors.RED,
      onConfirm,
      onCancel,
    })
    .then((answer) => answer && restart());
}

const GeneralSettingsTabs = { GENERAL: "general", ADVANCED: "advanced" } as const;

function EditNativeControlList({
  type,
  blacklist,
  whitelist,
}: {
  type: "blacklist" | "whitelist";
  blacklist?: string[];
  whitelist?: string[];
}): React.ReactElement {
  const EditModel = ({ transitionState, onClose }: RenderModalProps): React.ReactElement => {
    const [currentList, setCurrentList] = React.useState(
      (type === "blacklist" ? blacklist : whitelist) ?? [],
    );
    const pluginList = [...plugins.plugins.values()]
      .filter((x) => {
        return x.manifest.preload || x.manifest.main;
      })
      .sort((a, b) => a.manifest.name.toLowerCase().localeCompare(b.manifest.name.toLowerCase()));

    return (
      <Modal.ModalRoot size="medium" transitionState={transitionState}>
        <Modal.ModalHeader>
          <Flex justify={Flex.Justify.BETWEEN} align={Flex.Align.CENTER}>
            <Text.H1 style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              Edit Whitelist
            </Text.H1>
            <Modal.ModalCloseButton onClick={onClose} />
          </Flex>
        </Modal.ModalHeader>
        <Modal.ModalContent style={{ margin: "18px 0" }}>
          <div className="replugged-general-pluginIpc-editList">
            {pluginList.length ? (
              pluginList.map((plugin) => {
                const [value, setValue] = React.useState(currentList.includes(plugin.manifest.id));
                return (
                  <Checkbox
                    key={plugin.path}
                    label={plugin.manifest.name}
                    type="inverted"
                    value={value}
                    onChange={(e: boolean) => {
                      setCurrentList(
                        e
                          ? (list) => [...list, plugin.manifest.id]
                          : (list) => list.filter((id) => id !== plugin.manifest.id),
                      );
                      setValue(e);
                    }}
                  />
                );
              })
            ) : (
              <Text variant="heading-lg/bold" style={{ textAlign: "center" }}>
                No Supported Plugin Found!
              </Text>
            )}
          </div>
        </Modal.ModalContent>
        <Modal.ModalFooter>
          <Flex justify={Flex.Justify.BETWEEN}>
            <Button color={Button.Colors.RED} look={Button.Looks.OUTLINED} onClick={onClose}>
              {intl.string(discordT.CANCEL)}
            </Button>
            <Button
              color={Button.Colors.BRAND}
              look={Button.Looks.OUTLINED}
              onClick={() => {
                if (type === "blacklist") {
                  void RepluggedNative.pluginIpc.setBlacklisted(currentList);
                  return;
                }
                void RepluggedNative.pluginIpc.setWhitelisted(currentList);
              }}>
              Save Changes
            </Button>
          </Flex>
        </Modal.ModalFooter>
      </Modal.ModalRoot>
    );
  };

  return (
    <Button
      className={marginStyles.marginBottom20}
      onClick={() => {
        modal.openModal((props) => <EditModel {...props} />);
      }}>
      {type === "blacklist" ? "Edit Blacklist" : "Edit Whitelist"}
    </Button>
  );
}

function GeneralTab(): React.ReactElement {
  const [quickCSS, setQuickCSS] = useSettingArray(generalSettings, "quickCSS");
  const [disableMinimumSize, setDisableMinimumSize] = useSettingArray(
    generalSettings,
    "disableMinimumSize",
  );
  const [titleBar, setTitleBar] = useSettingArray(generalSettings, "titleBar");
  const [transparency, setTransparency] = useSettingArray(generalSettings, "transparency");
  const [backgroundMaterial, setBackgroundMaterial] = useSettingArray(
    generalSettings,
    "backgroundMaterial",
  );
  const [vibrancy, setVibrancy] = useSettingArray(generalSettings, "vibrancy");

  return (
    <Stack gap={24}>
      <Stack gap={16}>
        <Switch
          {...useSetting(generalSettings, "badges")}
          label={intl.string(t.REPLUGGED_SETTINGS_BADGES)}
          description={intl.string(t.REPLUGGED_SETTINGS_BADGES_DESC)}
        />
        <Switch
          {...useSetting(generalSettings, "addonEmbeds")}
          label={intl.string(t.REPLUGGED_SETTINGS_ADDON_EMBEDS)}
          description={intl.string(t.REPLUGGED_SETTINGS_ADDON_EMBEDS_DESC)}
        />
      </Stack>
      <Divider />
      <FieldSet label={intl.string(t.REPLUGGED_QUICKCSS)}>
        <Switch
          checked={quickCSS}
          onChange={(value) => {
            setQuickCSS(value);
            if (value) QuickCSS.load();
            else QuickCSS.unload();
          }}
          label={intl.string(t.REPLUGGED_SETTINGS_QUICKCSS_ENABLE)}
          description={intl.string(t.REPLUGGED_SETTINGS_QUICKCSS_ENABLE_DESC)}
        />
        <Switch
          {...useSetting(generalSettings, "autoApplyQuickCss")}
          disabled={!quickCSS}
          label={intl.string(t.REPLUGGED_SETTINGS_QUICKCSS_AUTO_APPLY)}
          description={intl.string(t.REPLUGGED_SETTINGS_QUICKCSS_AUTO_APPLY_DESC)}
        />
      </FieldSet>
      <Divider />
      <FieldSet
        label={intl.string(t.REPLUGGED_SETTINGS_WINDOW)}
        description={intl.string(t.REPLUGGED_SETTINGS_WINDOW_DESC)}>
        <Switch
          checked={disableMinimumSize}
          onChange={(value) => {
            setDisableMinimumSize(value);
            restartModal(true);
          }}
          label={intl.string(t.REPLUGGED_SETTINGS_DISABLE_MIN_SIZE)}
          description={intl.format(t.REPLUGGED_SETTINGS_DISABLE_MIN_SIZE_DESC, {})}
        />
        {window.DiscordNative.process.platform === "linux" && (
          <Switch
            checked={titleBar}
            onChange={(value) => {
              setTitleBar(value);
              restartModal(true);
            }}
            label={intl.string(t.REPLUGGED_SETTINGS_CUSTOM_TITLE_BAR)}
            description={intl.format(t.REPLUGGED_SETTINGS_CUSTOM_TITLE_BAR_DESC, {})}
          />
        )}
        <div>
          <Switch
            checked={transparency}
            onChange={(value) => {
              setTransparency(value);
              restartModal(true);
            }}
            label={intl.string(t.REPLUGGED_SETTINGS_TRANSPARENT)}
            description={intl.format(t.REPLUGGED_SETTINGS_TRANSPARENT_DESC, {})}
          />
          {(window.DiscordNative.process.platform === "linux" ||
            window.DiscordNative.process.platform === "win32") && (
            <Notice messageType={Notice.Types.WARNING}>
              {window.DiscordNative.process.platform === "linux"
                ? intl.format(t.REPLUGGED_SETTINGS_TRANSPARENT_ISSUES_LINUX, {})
                : intl.format(t.REPLUGGED_SETTINGS_TRANSPARENT_ISSUES_WINDOWS, {})}
            </Notice>
          )}
        </div>
        {window.DiscordNative.process.platform === "win32" && (
          <Select
            value={backgroundMaterial}
            onChange={(value) => {
              setBackgroundMaterial(value);
              void window.RepluggedNative.transparency.setBackgroundMaterial(value);
            }}
            disabled={!transparency}
            label={intl.string(t.REPLUGGED_SETTINGS_TRANSPARENCY_BG_MATERIAL)}
            options={BACKGROUND_MATERIALS.map((m) => ({
              label: m.charAt(0).toUpperCase() + m.slice(1),
              value: m,
            }))}
          />
        )}
        {window.DiscordNative.process.platform === "darwin" && (
          <Select
            disabled={!transparency}
            value={vibrancy}
            onChange={(value) => {
              setVibrancy(value);
              void window.RepluggedNative.transparency.setVibrancy(value);
            }}
            label={intl.string(t.REPLUGGED_SETTINGS_TRANSPARENCY_VIBRANCY)}
            options={VIBRANCY_SELECT_OPTIONS}
            clearable
          />
        )}
      </FieldSet>
    </Stack>
  );
}

function AdvancedTab(): React.ReactElement {
  const [experiments, setExperiments] = useSettingArray(generalSettings, "experiments");
  const [staffDevTools, setStaffDevTools] = useSettingArray(generalSettings, "staffDevTools");
  const [reactDevTools, setReactDevTools] = useSettingArray(generalSettings, "reactDevTools");
  const [keepToken, setKeepToken] = useSettingArray(generalSettings, "keepToken");

  const pluginIpc = generalSettings.useValue("pluginIpc");

  return (
    <Stack gap={24}>
      <Notice messageType={Notice.Types.WARNING}>
        {intl.string(t.REPLUGGED_SETTINGS_ADVANCED_DESC)}
      </Notice>
      <FieldSet label={intl.string(t.REPLUGGED_SETTINGS_DEVELOPMENT_TOOLS)}>
        <div>
          <Switch
            label={intl.string(t.REPLUGGED_SETTINGS_PLUGIN_IPC)}
            value={pluginIpc.enabled}
            onChange={(value) => {
              void RepluggedNative.pluginIpc.setEnabled(value);
            }}
          />
          {!pluginIpc.enabled && (
            <Notice
              className={"replugged-general-pluginIpc-notice"}
              messageType={Notice.HelpMessageTypes.WARNING}>
              {intl.format(t.REPLUGGED_SETTINGS_PLUGIN_IPC_DESC, {})}
            </Notice>
          )}

          {pluginIpc.enabled && (
            <>
              <RadioGroup
                className={marginStyles.marginBottom20}
                label={intl.string(t.REPLUGGED_SETTINGS_PLUGIN_IPC_CONTROL_MODE)}
                description={intl.string(t.REPLUGGED_SETTINGS_PLUGIN_IPC_CONTROL_MODE_DESC)}
                options={[
                  {
                    value: "whitelist",
                    name: intl.string(t.REPLUGGED_SETTINGS_PLUGIN_IPC_CONTROL_MODE_WHITELIST),
                  },
                  {
                    value: "blacklist",
                    name: intl.string(t.REPLUGGED_SETTINGS_PLUGIN_IPC_CONTROL_MODE_BLACKLIST),
                  },
                  {
                    value: "allowed",
                    name: intl.string(t.REPLUGGED_SETTINGS_PLUGIN_IPC_CONTROL_MODE_ALLOWED),
                  },
                ]}
                value={pluginIpc.mode}
                onChange={(e: string | null) => {
                  if (e !== pluginIpc.mode)
                    void RepluggedNative.pluginIpc.setMode(
                      e as "whitelist" | "blacklist" | "allowed",
                    );
                }}
              />
              {pluginIpc.mode !== "allowed" && (
                <EditNativeControlList
                  type={pluginIpc.mode}
                  blacklist={pluginIpc.blacklist}
                  whitelist={pluginIpc.whitelist}
                />
              )}
            </>
          )}
          <Switch
            checked={experiments}
            onChange={(value) => {
              setExperiments(value);
              restartModal();
            }}
            label={intl.string(t.REPLUGGED_SETTINGS_DISCORD_EXPERIMENTS)}
            description={intl.format(t.REPLUGGED_SETTINGS_DISCORD_EXPERIMENTS_DESC, {})}
          />
          <Notice messageType={Notice.Types.WARNING}>
            {intl.format(t.REPLUGGED_SETTINGS_DISCORD_EXPERIMENTS_WARNING, {})}
          </Notice>
        </div>
        <Switch
          disabled={!experiments}
          checked={staffDevTools}
          onChange={(value) => {
            setStaffDevTools(value);
            restartModal();
          }}
          label={intl.string(t.REPLUGGED_SETTINGS_DISCORD_DEVTOOLS)}
          description={intl.format(t.REPLUGGED_SETTINGS_DISCORD_DEVTOOLS_DESC, {})}
        />
        <Switch
          checked={reactDevTools}
          onChange={async (value) => {
            try {
              setReactDevTools(value);
              if (value) {
                await window.RepluggedNative.reactDevTools.downloadExtension();
              } else {
                await window.RepluggedNative.reactDevTools.removeExtension();
              }
              restartModal(true);
            } catch {
              // Revert setting on any error
              setReactDevTools(false);
              if (value) {
                try {
                  await window.RepluggedNative.reactDevTools.removeExtension();
                } catch {
                  // Ignore cleanup errors
                }
              }
              toast.toast(
                intl.string(t.REPLUGGED_SETTINGS_REACT_DEVTOOLS_FAILED),
                toast.Kind.FAILURE,
              );
            }
          }}
          label={intl.string(t.REPLUGGED_SETTINGS_REACT_DEVTOOLS)}
          description={intl.format(t.REPLUGGED_SETTINGS_REACT_DEVTOOLS_DESC, {})}
        />
      </FieldSet>
      <Divider />
      <Stack gap={16}>
        <Switch
          checked={keepToken}
          onChange={(value) => {
            setKeepToken(value);
            restartModal();
          }}
          label={intl.string(t.REPLUGGED_SETTINGS_KEEP_TOKEN)}
          description={intl.format(t.REPLUGGED_SETTINGS_KEEP_TOKEN_DESC, {})}
        />
        {window.DiscordNative.process.platform === "win32" && (
          <Switch
            {...useSetting(generalSettings, "winUpdater")}
            label={intl.string(t.REPLUGGED_SETTINGS_WIN_UPDATER)}
            description={intl.string(t.REPLUGGED_SETTINGS_WIN_UPDATER_DESC)}
          />
        )}
        <TextInput
          {...useSetting(generalSettings, "apiUrl")}
          label={intl.string(t.REPLUGGED_SETTINGS_BACKEND)}
          description={intl.string(t.REPLUGGED_SETTINGS_BACKEND_DESC)}
          placeholder={WEBSITE_URL}
          disabled
        />
      </Stack>
    </Stack>
  );
}

export function General(): React.ReactElement {
  const [selectedTab, setSelectedTab] = React.useState<string>(GeneralSettingsTabs.GENERAL);

  const [kKeys, setKKeys] = React.useState<string[]>([]);
  const isEasterEgg = kKeys.toString().includes(konamiCode.join(","));
  const [hue, setHue] = React.useState(0);

  React.useEffect(() => {
    if (!isEasterEgg) return;

    const id = requestAnimationFrame(() => {
      setHue((hue + 1) % 360);
    });
    return () => cancelAnimationFrame(id);
  }, [hue, isEasterEgg]);

  const listener = React.useCallback(
    (e: KeyboardEvent): void => {
      if (isEasterEgg) return;
      setKKeys((val) => [...val.slice(-1 * (konamiCode.length - 1)), e.code]);
    },
    [isEasterEgg],
  );

  React.useEffect(() => {
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [kKeys, isEasterEgg, listener]);

  return (
    <>
      <TabBar selectedItem={selectedTab} type="top" look="brand" onItemSelect={setSelectedTab}>
        <TabBar.Item id={GeneralSettingsTabs.GENERAL}>
          {intl.string(discordT.SETTINGS_GENERAL)}
        </TabBar.Item>
        <TabBar.Item id={GeneralSettingsTabs.ADVANCED}>
          {intl.string(discordT.SETTINGS_ADVANCED)}
        </TabBar.Item>
      </TabBar>
      <TabBar.Panel id={selectedTab} className="replugged-general-tabBarPanel">
        {selectedTab === GeneralSettingsTabs.GENERAL && <GeneralTab />}
        {selectedTab === GeneralSettingsTabs.ADVANCED && <AdvancedTab />}
      </TabBar.Panel>
      {isEasterEgg && (
        <Text.H1
          variant="heading-xxl/semibold"
          className="replugged-general-easter-egg"
          style={{ color: `hsl(${hue}, 100%, 50%)` }}>
          Wake up. Wake up. Wake up.
        </Text.H1>
      )}
    </>
  );
}
