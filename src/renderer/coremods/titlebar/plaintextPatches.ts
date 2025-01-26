import { init } from "src/renderer/apis/settings";
import { type GeneralSettings, type PlaintextPatch, defaultSettings } from "src/types";

const generalSettings = init<GeneralSettings, keyof typeof defaultSettings>(
  "dev.replugged.Settings",
  defaultSettings,
);

export default (navigator.userAgent.includes("Linux") && generalSettings.get("titlebar")
  ? [
      {
        find: "macOSFrame:!0",
        replacements: [
          {
            match: /(\[.&&).&&/,
            replace: (_, suffix: string) => `${suffix}`,
          },
        ],
      },
      {
        find: "renderWindow:window",
        replacements: [{ match: /\(0,\w+\.getPlatform\)\(\)/, replace: () => `"WINDOWS"` }],
      },
    ]
  : []) as PlaintextPatch[];
