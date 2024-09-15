import type { PlaintextPatch } from "src/types";

export default [
  {
    find: "Messages.MESSAGE_UTILITIES_A11Y_LABEL",
    replacements: [
      {
        match: /ExpandingButtons.{10,50}\.Fragment,{children:\[/,
        replace: (prefix) =>
          `${prefix}replugged.coremods.coremods.messagePopover?._buildPopoverElements(arguments[0]?.message,arguments[0]?.channel),`,
      },
    ],
  },
] as PlaintextPatch[];
