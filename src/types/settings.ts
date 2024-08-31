import { WEBSITE_URL } from "src/constants";
import type { Promisable } from "type-fest";

export type SettingsMap = Map<string, unknown>;
export type TransactionHandler<T> = () => Promisable<T>;
export type SettingsTransactionHandler<T> = (settings: SettingsMap) => Promisable<T>;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GeneralSettings = {
  apiUrl?: string;
  experiments?: boolean;
  badges?: boolean;
  autoApplyQuickCss?: boolean;
  showWelcomeNoticeOnOpen?: boolean;
  addonEmbeds?: boolean;
  reactDevTools?: boolean;
  titlebar?: boolean;
};

export const defaultSettings = {
  apiUrl: WEBSITE_URL,
  experiments: false,
  badges: true,
  autoApplyQuickCss: false,
  showWelcomeNoticeOnOpen: true,
  reactDevTools: false,
  addonEmbeds: true,
  titlebar: false,
} satisfies Partial<GeneralSettings>;
