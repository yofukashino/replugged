import type React from "react";
import components from "../common/components";
import { webpack } from "@replugged";

interface DividerProps {
  className?: string;
  style?: React.CSSProperties;
}

export type DividerType = React.FC<DividerProps>;

export default components.then((v) => webpack.getFunctionBySource<DividerType>(v, ".divider")!);
