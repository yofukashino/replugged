import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { ipcMain, shell } from "electron";
import { RepluggedIpcChannels } from "../../types";
import { CONFIG_PATHS } from "src/util.mjs";
import { readFileSync } from "fs";

const CSS_PATH = join(CONFIG_PATHS.quickcss, "main.css");

ipcMain.on(RepluggedIpcChannels.GET_QUICK_CSS, (event) => {
  try {
    event.returnValue = readFileSync(CSS_PATH, { encoding: "utf-8" });
  } catch {
    event.returnValue = "";
  }
});
ipcMain.on(RepluggedIpcChannels.SAVE_QUICK_CSS, (_, css: string) =>
  writeFile(CSS_PATH, css, { encoding: "utf-8" }),
);
ipcMain.on(RepluggedIpcChannels.OPEN_QUICKCSS_FOLDER, () => shell.openPath(CONFIG_PATHS.quickcss));
