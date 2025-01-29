import type React from "react";
import components from "../common/components";
import { webpack } from "@replugged";

export type FormTextTypeKey =
  | "DEFAULT"
  | "DESCRIPTION"
  | "ERROR"
  | "INPUT_PLACEHOLDER"
  | "LABEL_BOLD"
  | "LABEL_DESCRIPTOR"
  | "LABEL_SELECTED"
  | "SUCCESS"
  | string;

interface FormTextProps extends React.ComponentPropsWithoutRef<"div"> {
  type?: string;
  disabled?: boolean;
  selectable?: boolean;
}

export type FormTextCompType = React.FC<React.PropsWithChildren<FormTextProps>>;

export type FormTextType = Record<FormTextTypeKey, FormTextCompType>;

export const FormText: FormTextType = {
  DEFAULT: () => null,
  DESCRIPTION: () => null,
  ERROR: () => null,
  INPUT_PLACEHOLDER: () => null,
  LABEL_BOLD: () => null,
  LABEL_DESCRIPTOR: () => null,
  LABEL_SELECTED: () => null,
  SUCCESS: () => null,
};

const mapFormText = async (): Promise<void> => {
  const FormTextComp = webpack.getFunctionBySource<FormTextCompType>(
    await components,
    /type:\w+=\w+\.DEFAULT/,
  )!;
  const types = webpack.getExportsForProps<Record<FormTextTypeKey, string>>(await components, [
    "LABEL_DESCRIPTOR",
    "INPUT_PLACEHOLDER",
  ]);
  if (typeof types === "object" && types !== null)
    Object.keys(types).forEach((key) => {
      FormText[key] = (props: React.PropsWithChildren<FormTextProps>) => (
        <FormTextComp type={types[key]} {...props}>
          {props.children}
        </FormTextComp>
      );
    });
};

void mapFormText();
