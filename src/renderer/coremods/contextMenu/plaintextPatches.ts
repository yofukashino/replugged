import type { PlaintextPatch } from "src/types";
/* function unifyClass(fn: (...args: string[]) => string, ...classes: string[]): string {
  const names = new Set(
    fn
      .call(this, ...classes)
      .split(" ")
      .filter((c) => /_|-/.test(c)),
  );

  const suffixes = new Set<string>();
  names.forEach((name) => {
    const match = name.match(/^(\w+)_/);
    if (match) suffixes.add(match[1]);
  });

  return `${[...names].join(" ")} ${[...suffixes].join("_")}`;
} */

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

  /*   {
    find: "className:",
    replacements: [
        {
        match: /className:(\w+\.(\w+))/g,
        replace: (_, name, key) => `className:${name}+" ${key}"`,
      }, 
      {
        match: /className:(\w+\(\))/g,
        replace: (_, merger) =>
          `className:(unifyClass?.bind?.(this, ${merger}) ?? ${merger})`,
      },
    ],
  }, */
] as PlaintextPatch[];
