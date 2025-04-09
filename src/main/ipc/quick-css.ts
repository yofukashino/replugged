import { writeFile } from "fs/promises";
import { join } from "path";
import { BrowserWindow, ipcMain, shell } from "electron";
import { RepluggedIpcChannels } from "../../types";
import { CONFIG_PATHS } from "src/util.mjs";
import { FSWatcher, readFileSync, watch } from "fs";

const CSS_PATH = join(CONFIG_PATHS.quickcss, "main.css");

let fsWatcher: FSWatcher | undefined;

ipcMain.handle(RepluggedIpcChannels.GET_QUICK_CSS, (_) => readFileSync(CSS_PATH, "utf-8"));

ipcMain.on(RepluggedIpcChannels.SAVE_QUICK_CSS, (_, css: string) =>
  writeFile(CSS_PATH, css, { encoding: "utf-8" }),
);
ipcMain.on(RepluggedIpcChannels.OPEN_QUICKCSS_FOLDER, () => shell.openPath(CONFIG_PATHS.quickcss));

ipcMain.handle(RepluggedIpcChannels.WATCH_QUICK_CSS, () => {
  fsWatcher = watch(CONFIG_PATHS.quickcss, () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(RepluggedIpcChannels.QUICK_CSS_CHANGED);
    });
  });
});

ipcMain.handle(RepluggedIpcChannels.UNWATCH_QUICK_CSS, () => {
  fsWatcher?.close();
});
