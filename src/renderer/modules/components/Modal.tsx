import type React from "react";
import components from "../common/components";
import { getFunctionBySource } from "@webpack";

enum ModalTransitionState {
  ENTERING,
  ENTERED,
  EXITING,
  EXITED,
  HIDDEN,
}

interface ModalRootProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  children: React.ReactNode;
  transitionState?: ModalTransitionState;
  size?: "small" | "medium" | "large" | "dynamic";
  role?: "alertdialog" | "dialog";
  fullscreenOnMobile?: boolean;
  hideShadow?: boolean;
  onAnimationEnd?(): string;
  returnRef?: React.Ref<unknown>;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  direction?: string;
  justify?: string;
  align?: string;
  wrap?: string;
  separator?: boolean;
  className?: string;
}

interface ModalContentProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  scrollerRef?: React.Ref<unknown>;
  scrollbarType?: "auto" | "none" | "thin";
}

interface ModalFooterProps extends ModalHeaderProps {}

interface ModalCloseButtonProps {
  onClick(): void;
  withCircleBackground?: boolean;
  hideOnFullscreen?: boolean;
  focusProps?: Record<string, unknown>;
  className?: string;
}

export interface ModalType {
  ModalRoot: React.FC<ModalRootProps>;
  ModalHeader: React.FC<ModalHeaderProps>;
  ModalContent: React.FC<ModalContentProps>;
  ModalFooter: React.FC<ModalFooterProps>;
  ModalCloseButton: React.FC<ModalCloseButtonProps>;
}

const getModal = async (): Promise<ModalType> => ({
  ModalRoot: getFunctionBySource(await components, "().root")!,
  ModalHeader: getFunctionBySource(await components, "().header")!,
  ModalContent: getFunctionBySource(await components, "().content")!,
  ModalFooter: getFunctionBySource(await components, "().footerSeparator")!,
  ModalCloseButton: getFunctionBySource(await components, "().closeWithCircleBackground")!,
});

export default getModal();
