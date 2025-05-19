import { type PlaintextPatch } from "src/types";

export default [
  {
    find: `.jsx=`,
    replacements: [
      {
        match: /return{\$\$typeof:\w+,type:(\w+).+?props:(\w+)/,
        replace: (suffix, type, props) =>
          `${type} !== "html" &&  ${props}.className && (${props}.className = replugged.coremods.coremods.utc?._getUnifiedClassName(${props}.className));${suffix}`,
      },
    ],
  },
] as PlaintextPatch[];
