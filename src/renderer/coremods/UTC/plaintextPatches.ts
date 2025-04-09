import { type PlaintextPatch } from "src/types";

export default [
  {
    find: `.jsx=`,
    replacements: [
      {
        match: /return{\$\$typeof:.{10,25}props:(\w+),/,
        replace: (suffix, props) =>
          `${props}.className && (${props}.className = replugged.coremods.coremods.UTC?._getUnifiedClassName(${props}.className));${suffix}`,
      },
    ],
  },
] as PlaintextPatch[];
