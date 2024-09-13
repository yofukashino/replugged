/*
IPC events:
- REPLUGGED_LIST_THEMES: returns an array of all valid themes available
- REPLUGGED_UNINSTALL_THEME: uninstalls a theme by name
*/

import { extname, join, sep } from "path";
import { ipcMain, shell } from "electron";
import { RepluggedIpcChannels, type RepluggedTheme } from "../../types";
import { theme } from "../../types/addon";
import { CONFIG_PATHS } from "src/util.mjs";
import {
  type Dirent,
  type Stats,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
} from "fs";

const THEMES_DIR = CONFIG_PATHS.themes;

export const isFileATheme = (f: Dirent | Stats, name: string): boolean => {
  return f.isDirectory() || (f.isFile() && extname(name) === ".asar");
};

function getTheme(path: string): RepluggedTheme {
  const manifestPath = join(THEMES_DIR, path, "manifest.json");
  if (!manifestPath.startsWith(`${THEMES_DIR}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid theme name");
  }

  const manifest: unknown = JSON.parse(
    readFileSync(manifestPath, {
      encoding: "utf-8",
    }),
  );

  return {
    path,
    manifest: theme.parse(manifest),
  };
}

ipcMain.handle(RepluggedIpcChannels.GET_THEME, (_, path: string): RepluggedTheme | undefined => {
  try {
    return getTheme(path);
  } catch {}
});

ipcMain.on(RepluggedIpcChannels.LIST_THEMES, (): RepluggedTheme[] => {
  const themes = [];

  const themeDirs = readdirSync(THEMES_DIR, {
    withFileTypes: true,
  })
    .map((f) => {
      if (isFileATheme(f, f.name)) return f;
      if (f.isSymbolicLink()) {
        const actualPath = readlinkSync(join(THEMES_DIR, f.name));
        const actualFile = statSync(actualPath);
        if (isFileATheme(actualFile, actualPath)) return f;
      }
    })
    .filter(Boolean) as Dirent[];

  for (const themeDir of themeDirs) {
    try {
      themes.push(getTheme(themeDir.name));
    } catch (e) {
      console.error(e);
    }
  }

  return themes;
});

ipcMain.handle(RepluggedIpcChannels.UNINSTALL_THEME, (_, themeName: string) => {
  const themePath = join(THEMES_DIR, themeName);
  if (!themePath.startsWith(`${THEMES_DIR}${sep}`)) {
    // Ensure file changes are restricted to the base path
    throw new Error("Invalid theme name");
  }

  rmSync(themePath, {
    recursive: true,
    force: true,
  });
});

ipcMain.on(RepluggedIpcChannels.OPEN_THEMES_FOLDER, () => shell.openPath(THEMES_DIR));
