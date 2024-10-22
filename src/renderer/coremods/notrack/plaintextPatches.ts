import type { PlaintextPatch } from "src/types";

const standardiseClass = (classString: string): string => {
  const classKeys = classString.matchAll(/(\w+)(?:[_]+|[-]+)/g).map(([_, key]) => key);
  return `replugged-${Array.from(classKeys).join("_")}`;
};

// Monkey-patch classList
/* for (const fnName of Object.keys(DOMTokenList.prototype)) {
  try {
    if (typeof DOMTokenList.prototype[fnName] === "function") {
      const original = DOMTokenList.prototype[fnName];
      DOMTokenList.prototype[fnName] = function (...classes) {
        return original.apply(
          this,
          classes.some((c) => typeof c !== "string")
            ? classes
            : classes.map((c) => c.split(" ")).flat(10),
        );
      };
    }
  } catch {}
} */
export default [
  /*   {
    find: /\.exports={\w+\:/,
    replacements: [
      {
        match: /:"([\w\d\s_-]+)"/g,
        replace: (_, string: string) => `:"${string} ${standardiseClass(string)}"`,
      },
    ],
  }, */
  {
    replacements: [
      {
        match: /window\.DiscordSentry=function\(\){/,
        replace: "$&return;",
      },
      {
        match: /crossDomainError=function\(\){/,
        replace: "$&return;",
      },
    ],
  },
  {
    find: "window.DiscordSentry",
    replacements: [
      {
        match: /null!=window.DiscordSentry/g,
        replace: "false",
      },
    ],
  },
  {
    find: "crashReporter.updateCrashReporter",
    replacements: [{ match: /updateCrashReporter\(\w+\){/, replace: "$&return;" }],
  },
  {
    find: "TRACKING_URL:",
    replacements: [
      {
        replace: "",
      },
    ],
  },
  {
    find: /this\._metrics\.push\(.\);/,
    replacements: [
      {
        match: /this\._metrics\.push\(.\);/,
        replace: "",
      },
    ],
  },
] as PlaintextPatch[];
