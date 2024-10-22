import type { PlaintextPatch } from "src/types";

export default [
  {
    //disables api request to find commands if its added by replugged
    find: "Not injecting stylesheet",
    replacements: [
      {
        match:
          /if\([^)]+\)(\{new \w+\.\w+\("PopoutWindowStore"\)\.warn\("Not injecting stylesheet)/,
        replace: (_, suffix) => `if(false)${suffix}`,
      },
    ],
  },
] as PlaintextPatch[];
