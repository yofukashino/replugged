/*
IPC events:
- REPLUGGED_LIST_THEMES: returns an array of all valid themes available
- REPLUGGED_UNINSTALL_THEME: uninstalls a theme by name
*/

import {
  type Dirent,
  type Stats,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { extname, join, sep } from "path";
import { ipcMain, shell } from "electron";
import { RepluggedIpcChannels, type RepluggedTheme } from "../../types";
import { theme } from "../../types/addon";
import { CONFIG_PATHS, extractAddon } from "src/util.mjs";
import { Logger } from "..";

const THEMES_DIR = CONFIG_PATHS.themes;
const TEMP_THEMES_DIR = CONFIG_PATHS.temp_themes;

export const isFileATheme = (f: Dirent | Stats, name: string): boolean => {
  return f.isDirectory() || (f.isFile() && extname(name) === ".asar");
};

function getTheme(path: string): RepluggedTheme {
  const isAsar = path.includes(".asar");
  const themePath = join(THEMES_DIR, path);
  const realThemePath = isAsar ? join(TEMP_THEMES_DIR, path.replace(/\.asar$/, "")) : themePath; // Remove ".asar" from the directory name
  if (isAsar) extractAddon(themePath, realThemePath);

  const manifestPath = join(realThemePath, "manifest.json");

  if (!manifestPath.startsWith(`${realThemePath}${sep}`)) {
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

ipcMain.on(RepluggedIpcChannels.LIST_THEMES, (event) => {
  const themes = [];

  const themeDirs = readdirSync(THEMES_DIR, {
    withFileTypes: true,
  })
    .map((f) => {
      if (isFileATheme(f, f.name)) return f;
      if (f.isSymbolicLink()) {
        try {
          const actualPath = readlinkSync(join(THEMES_DIR, f.name));
          const actualFile = statSync(actualPath);
          if (isFileATheme(actualFile, actualPath)) return f;
        } catch {}
      }
      return void 0;
    })
    .filter(Boolean) as Dirent[];

  for (const themeDir of themeDirs) {
    try {
      themes.push(getTheme(themeDir.name));
    } catch (e) {
      Logger.error(e);
    }
  }

  event.returnValue = themes;
});

ipcMain.handle(RepluggedIpcChannels.UNINSTALL_THEME, (_, themeName: string) => {
  const isAsar = themeName.includes(".asar");
  const themePath = join(THEMES_DIR, themeName);
  const realThemePath = isAsar
    ? join(TEMP_THEMES_DIR, themeName.replace(/\.asar$/, ""))
    : themePath; // Remove ".asar" from the directory name

  if (!realThemePath.startsWith(`${isAsar ? TEMP_THEMES_DIR : THEMES_DIR}${sep}`)) {
    throw new Error("Invalid theme name");
  }
  if (isAsar) {
    unlinkSync(themePath);
    rmdirSync(realThemePath, { recursive: true });
  } else rmdirSync(themePath, { recursive: true });
});

ipcMain.on(RepluggedIpcChannels.OPEN_THEMES_FOLDER, () => shell.openPath(THEMES_DIR));

ipcMain.handle(RepluggedIpcChannels.CLEAR_TEMP_THEME, () => {
  try {
    rmdirSync(TEMP_THEMES_DIR, { recursive: true });
  } catch {}
});
