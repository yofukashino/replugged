import { init } from "src/renderer/apis/settings";
import { type GeneralSettings, type PlaintextPatch, defaultSettings } from "src/types";

const generalSettings = init<GeneralSettings, keyof typeof defaultSettings>(
  "dev.replugged.Settings",
  defaultSettings,
);

export default (true && generalSettings.get("titlebar")
  ? [
      {
        find: "macOSFrame:!0",
        replacements: [
          {
            match: /\[.&&(null!=.\?)/,
            replace: (_, suffix: string) => `[${suffix}`,
          },
        ],
      },
      {
        find: "renderWindow:window",
        replacements: [{ match: /\(0,.\.getPlatform\)\(\)/, replace: () => `"WINDOWS"` }],
      },
    ]
  : []) as PlaintextPatch[];
