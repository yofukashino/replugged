import type React from "react";
<<<<<<< HEAD
import components from "../common/components";
=======
import { waitForProps } from "../webpack";
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada

interface TextInputProps
  extends Omit<
    React.ComponentPropsWithoutRef<"input">,
    "size" | "onChange" | "onFocus" | "onBlur"
  > {
  editable?: boolean;
  inputPrefix?: string;
  prefixElement?: React.ReactNode;
  size?: string;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  focusProps?: Record<string, unknown>;
  inputClassName?: string;
  defaultDirty?: boolean;
  onChange?: (value: string, name: string) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>, name: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>, name: string) => void;
}

export type TextInputType = React.ComponentClass<TextInputProps> & {
  defaultProps: TextInputProps;
  Sizes: Record<"DEFAULT" | "MINI", string>;
};

<<<<<<< HEAD
export default components.TextInput;
=======
export default await waitForProps<Record<"TextInput", TextInputType>>("TextInput").then(
  (x) => x.TextInput,
);
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada
