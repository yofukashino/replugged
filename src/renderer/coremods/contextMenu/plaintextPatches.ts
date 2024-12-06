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
    find: ".Menu,{",
    replacements: [
      {
        match: /\.Menu,{/g,
        replace: (prefix) => `${prefix}data:arguments,`,
      },
    ],
  },

  {
    find: ".getBinds()",
    replacements: [
      {
        match: /"en-US"\)\.getBinds\(\);((\w+)\.\w+=(\w+))/g,
        replace: (_, suffix, mod, variable) =>
          `"en-US");${suffix}.getBinds();${mod}.ZP=${variable}`,
      },
    ],
  },
] as PlaintextPatch[];
