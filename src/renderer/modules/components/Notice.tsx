import components from "@common/components";
import type React from "react";
import type { Variant } from "./Text";
import { webpack } from "@replugged";

const HelpMessageTypes = {
  WARNING: 0,
  INFO: 1,
  ERROR: 2,
  POSITIVE: 3,
} as const;

interface HelpMessageProps {
  children: React.ReactNode;
  messageType: (typeof HelpMessageTypes)[keyof typeof HelpMessageTypes];
  textColor?: string;
  textVariant?: Variant;
  className?: string;
}

export type NoticeType = React.FC<HelpMessageProps> & {
  Types: typeof HelpMessageTypes; // for backwards compat
  HelpMessageTypes: typeof HelpMessageTypes;
};
const getNotice = async (): Promise<NoticeType> => {
  const HelpMessage = webpack.getFunctionBySource(await components, "messageType:")!;
  HelpMessage.HelpMessageTypes = HelpMessageTypes;
  HelpMessage.Types = HelpMessage.HelpMessageTypes;
  return HelpMessage;
};

export default getNotice();
