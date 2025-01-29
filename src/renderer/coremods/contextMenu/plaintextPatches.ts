import type { PlaintextPatch } from "src/types";

export default [
  {
    find: "♫ (つ｡◕‿‿◕｡)つ ♪",
    replacements: [
      {
        match: /((\w+)\){)(var\s*\w+;let{navId:)/,
        replace: (_, prefix, props, suffix) =>
          `${prefix}${props}=replugged.coremods.coremods.contextMenu?._insertMenuItems(${props});${suffix}`,
      },
    ],
  },
  {
    find: "navId:",
    replacements: [
      {
        match: /return\(0,\w+\.\w+\)\(\w+\.\w+,{/g,
        replace: (prefix) => `${prefix}data:arguments,`,
      },
    ],
  },
] as PlaintextPatch[];
