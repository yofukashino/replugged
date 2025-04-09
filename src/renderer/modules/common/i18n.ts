import type {
  FormatFunction,
  IntlManager,
  IntlMessageGetter,
  TypedIntlMessageGetter,
  astFormatter,
  makeReactFormatter,
  markdownFormatter,
  stringFormatter,
} from "@discord/intl";
import { getExportsForProps, getFunctionBySource, waitForModule, waitForProps } from "../webpack";
import { bySource } from "../webpack/filters";

type MessagesBinds = Record<string, TypedIntlMessageGetter<object>>;

interface Locale {
  value: string;
  name: string;
  localizedName: IntlMessageGetter;
}

interface Language {
  name: string;
  englishName: string;
  code: string;
  postgresLang: string;
  enabled: boolean;
  enabledAPI?: boolean;
}

export interface I18n {
  getAvailableLocales: () => Locale[];
  getLanguages: () => Language[];
  getSystemLocale: (defaultLocale: string) => string;
  international: MessagesBinds;
  intl: IntlManager & {
    format: FormatFunction<ReturnType<typeof makeReactFormatter>>;
    formatToPlainString: FormatFunction<typeof stringFormatter>;
    formatToMarkdownString: FormatFunction<typeof markdownFormatter>;
    formatToParts: FormatFunction<typeof astFormatter>;
  };
  runtimeHashMessageKey: Hash["runtimeHashMessageKey"];
  t: MessagesBinds;
}

export interface Hash {
  runtimeHashMessageKey: (key: string) => string;
}

const getI18n = async (): Promise<I18n> => {
  const intlMod = await waitForModule<I18n>(bySource(/new \w+\.IntlManager/));
  const getAvailableLocales = getFunctionBySource(intlMod, /{return \w+\(\d+\)}/);
  const getLanguages = getFunctionBySource(intlMod, ".runtimeHashMessageKey");

  const intl = getExportsForProps(intlMod, ["defaultLocale", "currentLocale"]);
  const discordT = getExportsForProps(intlMod, ["$$loader", "$$baseObject"]);

  const { runtimeHashMessageKey } = await waitForProps<Hash>("runtimeHashMessageKey");

  const t = new Proxy(discordT, {
    get: (t, key: string) => t[runtimeHashMessageKey(key)],
  });
  return {
    getAvailableLocales,
    getLanguages,
    intl,
    runtimeHashMessageKey,
    t,
  };
};

export default getI18n();
