import { React } from "@common";
import type { ContextMenuProps } from "@components/ContextMenu";
import type {
  ContextItem,
  ContextMenuTypes,
  GetContextItem,
  RawContextItem,
} from "../../../types/coremods/contextMenu";
import { Logger } from "../../modules/logger";
import { ContextMenu as ContextComponents } from "../../modules/components";

const logger = Logger.api("ContextMenu");

export const menuItems = {} as Record<
  ContextMenuTypes,
  Array<{ getItem: GetContextItem; sectionId: number | undefined; indexInSection: number }>
>;

type RepluggedContextItem = ContextItem & {
  props: { replug?: boolean; id?: string };
};

/**
 * Converts data into a React element. Any elements or falsy value will be returned as is
 * @param raw The data to convert
 * @returns The converted item
 */
function makeItem(
  raw: RawContextItem | ContextItem | undefined | void,
): RepluggedContextItem | undefined {
  // Occasionally React won't be loaded when this function is ran, so we don't return anything
  if (!React) return undefined;

  if (!raw) {
    // If something falsy is passed, let it through
    // Discord just skips over them too
    return raw as undefined;
  }
  if (React.isValidElement(raw)) {
    // We can't construct something that's already made
    return raw as RepluggedContextItem;
  }

  const { type, ...props } = raw;
  // add in prop  for cleanup
  if (props.children) {
    props.children = props.children.map((child: RawContextItem | ContextItem | undefined) =>
      makeItem(child),
    );
  }

  return React.createElement(type as React.FC, props as Record<string, unknown>);
}

/**
 * Add an item to any context menu
 * @param navId The id of the menu you want to insert to
 * @param getItem A function that creates and returns the menu item
 * @param sectionId The number of the section to add to. Defaults to replugged's section
 * @param indexInSection The index in the section to add to. Defaults to the end position
 * @returns A callback to de-register the function
 */
export function addContextMenuItem(
  navId: ContextMenuTypes,
  getItem: GetContextItem,
  sectionId: number | undefined,
  indexInSection: number,
): () => void {
  if (!menuItems[navId]) menuItems[navId] = [];

  menuItems[navId].push({ getItem, sectionId, indexInSection });
  return () => removeContextMenuItem(navId, getItem);
}

/**
 * Remove an item from a context menu
 * @param navId The id of the menu the function was registered to
 * @param getItem The function to remove
 * @returns
 */
export function removeContextMenuItem(navId: ContextMenuTypes, getItem: GetContextItem): void {
  const items = menuItems[navId];

  menuItems[navId] = items.filter((item) => item.getItem !== getItem);
}

type ContextMenuData = ContextMenuProps["ContextMenu"] & {
  children: React.ReactElement | React.ReactElement[];
  data: Array<Record<string, unknown>>;
  navId: ContextMenuTypes;
  plugged?: boolean;
};

/**
 * @internal
 * @hidden
 */
export function _buildPatchedMenu(menu: ContextMenuData): React.ReactElement | null {
  const { navId } = menu;
  const {
    MenuGroup,
    ContextMenu,
  }: {
    MenuGroup: React.FC<ContextMenuProps["MenuGroup"]>;
    ContextMenu: React.FC<ContextMenuProps["ContextMenu"] & { plugged?: boolean }>;
  } = ContextComponents;

  //return nothing as we weren't able to get ContextMenu component, gets handled in plain text patch
  if (!ContextMenu) return null;

  // No items to insert
  // Or MenuGroup Component is not available
  if (!menuItems[navId] || !MenuGroup) return <ContextMenu {...menu} plugged={true} />;

  // The data as passed as Arguments from the calling function, so we just grab what we want from it
  const data = menu.data[0];

  // make children array if it's not already
  if (!Array.isArray(menu.children)) {
    menu.children = [menu.children];
    if (!Array.isArray(menu.children)) {
      return <ContextMenu {...menu} plugged={true} />;
    }
  }

  //Add group only if it doesn't exist
  if (!menu.children?.some?.((child) => child?.props?.id === "replugged")) {
    const repluggedGroup = <MenuGroup />;
    repluggedGroup.props.id = "replugged";
    repluggedGroup.props.children = [];

    // Add in the new menu items right above the DevMode Copy ID
    // If the user doesn't have DevMode enabled, the new items will be at the bottom
    const hasCopyId =
      menu.children.at(-1)?.props?.children?.props?.id?.startsWith("devmode-copy-id-") ||
      menu.children
        .at(-1)
        ?.props?.children?.some((c: React.ReactElement) =>
          c?.props?.id?.startsWith("devmode-copy-id-"),
        );
    if (hasCopyId) {
      menu.children.splice(-1, 0, repluggedGroup);
    } else {
      menu.children.push(repluggedGroup);
    }
  }

  //get sections from where to clean items
  const usedSectionIds = menuItems[navId]
    .map((item) => item.sectionId)
    .filter((item, index, array) => array.indexOf(item) === index);

  //cleaning old items before adding new ones
  usedSectionIds.forEach((sectionId) => {
    try {
      if (!Array.isArray(menu.children)) {
        return;
      }
      if (menu.children.at(sectionId!)?.props?.children) {
        menu.children.at(sectionId!)!.props.children = Array.isArray(
          menu.children.at(sectionId!)?.props.children,
        )
          ? menu.children
              .at(sectionId!)
              ?.props.children.filter((child: React.ReactElement) => !child?.props?.replug)
          : [menu.children.at(sectionId!)?.props.children];
      }
    } catch (err) {
      logger.error(
        "Error while removing old menu items",
        err,
        Array.isArray(menu.children) ? menu.children.at(sectionId!) : null,
      );
    }
  });

  //adding new items
  menuItems[navId].forEach((item) => {
    try {
      if (!Array.isArray(menu.children)) {
        return;
      }
      const itemRet = makeItem(item.getItem(data, menu));
      if (itemRet) {
        // adding prop for easy cleanup
        itemRet.props.replug = true;
        // custom unique id if not added by dev
        itemRet.props.id ??= `repluggedItem-${Number(`0.${Date.now()}`).toString(36).substring(2)}`;
        const hasCopyId =
          menu.children.at(-1)?.props?.children?.props?.id?.startsWith("devmode-copy-id-") ||
          menu.children
            .at(-1)
            ?.props?.children.some((c: React.ReactElement) =>
              c?.props?.id?.startsWith("devmode-copy-id-"),
            );
        const section =
          typeof item.sectionId === "undefined"
            ? menu.children.at(hasCopyId ? -2 : -1)
            : menu.children.at(item.sectionId);
        if (!section) return logger.error("Couldn't find section", item.sectionId, menu.children);
        section?.props.children?.splice(item.indexInSection, 0, itemRet);
      }
    } catch (err) {
      logger.error(
        "Error while running GetContextItem function",
        err,
        item.getItem,
        Array.isArray(menu.children) ? menu.children.at(item.sectionId!) : null,
      );
    }
  });

  return <ContextMenu {...menu} plugged={true} />;
}
