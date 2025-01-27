import { filters, getFunctionBySource, waitForModule } from "@webpack";
import type {
  LabelCallback,
  Section as SectionType,
  SettingsTools,
} from "../../../types/coremods/settings";
import type React from "react";

const getPos = (pos: number | undefined): number => pos ?? -4;

let getQuery: (() => string) | undefined;

void waitForModule(filters.bySource(/return \w+\(\)\.query/)).then((UserSettingQueryMod) => {
  getQuery = getFunctionBySource<() => string>(UserSettingQueryMod, "().query")!;
});

export const Section = ({
  name,
  _id,
  label,
  color,
  elem,
  pos,
  fromEnd,
  predicate,
}: {
  name: string;
  _id?: string;
  label?: string | LabelCallback;
  color?: string;
  elem: (args: unknown) => React.ReactElement;
  pos?: number;
  fromEnd?: boolean;
  predicate?: (query: string) => boolean;
}): SectionType => ({
  section: name,
  _id,
  label,
  color,
  tabPredicate: () => predicate?.(getQuery?.() || "") ?? true,
  element: elem,
  pos: getPos(pos),
  fromEnd: fromEnd ?? getPos(pos) < 0,
});

export const Divider = (pos?: number): SectionType => ({
  section: "DIVIDER",
  pos: getPos(pos),
  tabPredicate: () => !getQuery?.(),
});

export const Header = (label: string | LabelCallback, pos?: number): SectionType => ({
  section: "HEADER",
  label,
  pos: getPos(pos),
  tabPredicate: () => !getQuery?.(),
});

export const settingsTools: SettingsTools = {
  rpSections: [],
  rpSectionsAfter: new Map(),
  addSection(opts) {
    const data = Section(opts);

    settingsTools.rpSections.push(data);
    return data;
  },
  removeSection(sectionName) {
    settingsTools.rpSections = settingsTools.rpSections.filter(
      (s) => s.section !== sectionName && s._id !== sectionName,
    );
  },
  addAfter(sectionName, sections) {
    if (!Array.isArray(sections)) sections = [sections];
    settingsTools.rpSectionsAfter.set(sectionName, sections);

    return sections;
  },
  removeAfter(sectionName) {
    settingsTools.rpSectionsAfter.delete(sectionName);
  },
};

export function insertSections(sections: SectionType[]): SectionType[] {
  for (const section of settingsTools.rpSections) {
    sections.splice(section.fromEnd ? sections.length + section.pos : section.pos, 0, section);
  }

  for (const sectionName of settingsTools.rpSectionsAfter.keys()) {
    const section = sections.findIndex((s) => s.section === sectionName);
    if (section === -1) continue;

    for (const section of settingsTools.rpSectionsAfter.get(sectionName)!) {
      const labelFn = section.__$$label;

      if (typeof section.label === "function" || typeof labelFn === "function") {
        if (!labelFn) {
          section.__$$label = section.label as LabelCallback;
        }

        section.label = section.__$$label?.();
      }
    }

    sections.splice(section + 1, 0, ...settingsTools.rpSectionsAfter.get(sectionName)!);
  }

  return sections;
}
