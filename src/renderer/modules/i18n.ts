import { i18n } from "@common";
import type { loadAllMessagesInLocale as LoadAllMessagesInLocale } from "@discord/intl";
import { waitForProps } from "@webpack";
import { messagesLoader } from "i18n/en-US.messages.js";
import { DEFAULT_LOCALE } from "src/constants";

export let locale: string | undefined;
export { messagesLoader, default as t } from "i18n/en-US.messages.js";
export function load(): void {
  void messagesLoader.waitForDefaultLocale(true);
  locale = i18n.intl.currentLocale || i18n.intl.defaultLocale || DEFAULT_LOCALE;

  i18n.intl.onLocaleChange((newLocale) => {
    locale = newLocale;
    void addRepluggedStrings();
  });
  void addRepluggedStrings();
}

export async function addRepluggedStrings(): Promise<void> {
  const { loadAllMessagesInLocale } = await waitForProps<{
    loadAllMessagesInLocale: typeof LoadAllMessagesInLocale;
  }>("loadAllMessagesInLocale");

  if (locale) {
    void loadAllMessagesInLocale(locale);
  }
}
