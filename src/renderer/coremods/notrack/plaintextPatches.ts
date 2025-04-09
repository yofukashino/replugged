import type { PlaintextPatch } from "src/types";

export default [
  {
    find: "AnalyticsActionHandlers.handleTrack",
    replacements: [
      {
        match: /(\(\)|\w+)=>\w+\.AnalyticsActionHandlers\.handle\w+\([^)]*\)/g,
        replace: (_) => `arg=>{arg?.resolve?.()}`,
      },
    ],
  },

  {
    find: "window.DiscordSentry",
    replacements: [
      {
        match: /\w+=window\.DiscordSentry/g,
        replace: "null",
      },
    ],
  },
  {
    find: "crashReporter.updateCrashReporter",
    replacements: [{ match: /updateCrashReporter\(\w+\){/, replace: "$&return;" }],
  },
  {
    find: /this\._metrics\.push\(.\),/,
    replacements: [
      {
        match: /this\._metrics\.push\(.\),/,
        replace: "",
      },
    ],
  },
  {
    find: "https://datadog.discord.tools/apm/",
    replacements: [
      {
        match:
          /\w+\.\w+\.toURLSafe\("traces\?"\.concat\(\w+\.toString\(\)\),"https:\/\/datadog\.discord\.tools\/apm\/"\)/,
        replace: '""',
      },
    ],
  },
] as PlaintextPatch[];
