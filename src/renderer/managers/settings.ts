import { WEBSITE_URL } from "src/constants";
import { init } from "src/renderer/apis/settings";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GeneralSettings = {
  apiUrl?: string;
  experiments?: boolean;
  staffDevTools?: boolean;
  badges?: boolean;
  autoApplyQuickCss?: boolean;
  showWelcomeNoticeOnOpen?: boolean;
  addonEmbeds?: boolean;
  reactDevTools?: boolean;
  titleBar?: boolean;
  quickCSS?: boolean;
  keepToken?: boolean;
  pluginIpc?: {
    enabled: boolean;
    mode: "whitelist" | "blacklist" | "allowed";
    blacklist: string[];
    whitelist: string[];
  };
};

const defaultSettings = {
  apiUrl: WEBSITE_URL,
  experiments: false,
  staffDevTools: false,
  badges: true,
  autoApplyQuickCss: false,
  showWelcomeNoticeOnOpen: true,
  reactDevTools: false,
  addonEmbeds: true,
  titleBar: false,
  quickCSS: true,
  keepToken: false,
  pluginIpc: { enabled: false, mode: "whitelist", blacklist: [], whitelist: [] },
} satisfies Partial<GeneralSettings>;

export const generalSettings = init<GeneralSettings, keyof typeof defaultSettings>(
  "dev.replugged.Settings",
  defaultSettings,
);
