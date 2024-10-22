import { React, components, lodash } from "@common";
import type { MenuProps } from "@components/ContextMenu";
import type {
  ContextMenuTypes,
  GetContextItem,
  RawContextItem,
} from "../../../types/coremods/contextMenu";
import { Logger } from "../../modules/logger";

const logger = Logger.api("ContextMenu");

<<<<<<< HEAD
export const menuItems: Record<
  string,
  | Array<{ getItem: GetContextItem; sectionId: number | undefined; indexInSection: number }>
  | undefined
> = {};
=======
export const menuItems = {} as Record<
  ContextMenuTypes,
  | Array<{ getItem: GetContextItem; sectionId: number | undefined; indexInSection: number }>
  | undefined
>;
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada

/**
 * Converts data into a React element. Any elements or falsy value will be returned as is
 * @param raw The data to convert
 * @returns The converted item
 */
<<<<<<< HEAD
function makeItem(raw: ReturnType<GetContextItem>): React.ReactElement | undefined {
  if (!raw) return;
  if (React.isValidElement(raw)) return raw;
=======
function makeItem(raw: RawContextItem | ContextItem | undefined | void): ContextItem | undefined {
  // Occasionally React won't be loaded when this function is ran, so we don't return anything
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!React) return undefined;
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada

  const { type, ...props } = raw as RawContextItem;

  if ("children" in props && props.children) {
    if (Array.isArray(props.children)) {
      props.children = props.children.map((child: ReturnType<GetContextItem>) => makeItem(child));
    } else {
      props.children = makeItem(props.children as ReturnType<GetContextItem>);
    }
  }

  return React.createElement(type as React.FC, props as Record<string, unknown>);
}

/**
 * Add an item to any context menu
 * @param navId The id of the menu you want to insert to
 * @param getItem A function that creates and returns the menu item
 * @param sectionId The number of the section to add to. Defaults to Replugged's section
 * @param indexInSection The index in the section to add to. Defaults to the end position
 * @returns A callback to de-register the function
 */
export function addContextMenuItem(
  navId: ContextMenuTypes,
  getItem: GetContextItem,
  sectionId: number | undefined,
  indexInSection: number,
): () => void {
  menuItems[navId] ||= [];

  menuItems[navId]?.push({ getItem, sectionId, indexInSection });
  return () => removeContextMenuItem(navId, getItem);
}

/**
 * Remove an item from a context menu
 * @param navId The id of the menu the function was registered to
 * @param getItem The function to remove
 * @returns
 */
export function removeContextMenuItem(navId: ContextMenuTypes, getItem: GetContextItem): void {
  menuItems[navId] = menuItems[navId]?.filter((item) => item.getItem !== getItem);
}

type ContextMenuProps = MenuProps & {
  data: Array<Record<string, unknown>>;
};

/**
 * @internal
 * @hidden
 */
export function _insertMenuItems(props: ContextMenuProps): ContextMenuProps {
  const menuItemsPatches = menuItems[props.navId];
  if (!menuItemsPatches) return props;

<<<<<<< HEAD
  props = {
    ...props,
    // Shallow clone the children array and objects
    children: lodash.cloneDeep(props.children),
  };
=======
  // No items to insert
  if (!menuItems[navId]) return;

  // Already inserted items
  // If this isn't here, another group of items is added every update
  if (menu.plugged) return;

  // We delay getting the items until now, as importing at the start of the file causes Discord to hang
  // Using `await import(...)` is undesirable because the new items will only appear once the menu is interacted with
  const { MenuGroup } = getByProps<Record<string, React.ComponentType>>([
    "Menu",
    "MenuItem",
    "MenuGroup",
  ]) || { MenuGroup: undefined };
  if (!MenuGroup) return;

  // The data as passed as Arguments from the calling function, so we just grab what we want from it
  const data = menu.data[0];
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada

  const { MenuGroup } = components;
  const repluggedGroup = <MenuGroup />;
  repluggedGroup.props.children = [];

  if (!Array.isArray(props.children)) props.children = [props.children];

<<<<<<< HEAD
  menuItemsPatches.forEach(({ getItem, sectionId, indexInSection }) => {
    try {
      const item = makeItem(getItem(props.data[0], props));
      if (!item) return;

      if (sectionId !== undefined && Array.isArray(props.children)) {
        const section = props.children.at(sectionId);

        if (!section) {
          logger.error("Couldn't find section", sectionId, props.children);
          return;
        }

        if (!Array.isArray(section.props.children))
          section.props.children = [section.props.children];

        section.props.children.splice(indexInSection, 0, item);
      } else {
        repluggedGroup.props.children.push(item);
      }
    } catch (e) {
      logger.error(`Failed to add item to menu ${props.navId}`, e);
=======
  menuItems[navId]?.forEach((item) => {
    try {
      const res = makeItem(item.getItem(data, menu)) as
        | (ContextItem & { props: { id?: string } })
        | undefined;
      if (res?.props) {
        // add in unique ids
        res.props.id = `${res.props.id || "repluggedItem"}-${Math.random()
          .toString(36)
          .substring(2)}`;
      }

      if (!Array.isArray(menu.children)) menu.children = [menu.children];
      const section =
        typeof item.sectionId === "undefined" ? repluggedGroup : menu.children.at(item.sectionId);
      if (!section) {
        logger.error("Couldn't find section", item.sectionId, menu.children);
        return;
      }
      section.props.children.splice(item.indexInSection, 0, res);
    } catch (err) {
      logger.error("Error while running GetContextItem function", err, item.getItem);
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada
    }
  });

  const hasCopyId = props.children
    .at(-1)
    ?.props?.children?.props?.id?.startsWith("devmode-copy-id-");
  if (hasCopyId) {
    props.children.splice(-1, 0, repluggedGroup);
  } else {
    props.children.push(repluggedGroup);
  }

  return props;
}
