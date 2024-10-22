import { ipcMain, BrowserWindow } from "electron";
import { join } from "path";
import { readFileSync } from "fs";
import "./plugins";
import "./themes";
import "./quick-css";
import "./settings";
import "./installer";
import "./i18n";
import "./react-devtools";

import { RepluggedIpcChannels, type RepluggedWebContents } from "../../types";
import { DiscordNative } from '../../globals';

ipcMain.on(RepluggedIpcChannels.GET_DISCORD_PRELOAD, (event) => {
  event.returnValue = (event.sender as RepluggedWebContents).originalPreload;
});

ipcMain.on(RepluggedIpcChannels.GET_REPLUGGED_RENDERER, (event) => {
  event.returnValue = `(async function(){ ${readFileSync(join(__dirname, "./renderer.js"), "utf-8")} })().catch(console.error)\n\n//# sourceURL=RepluggedRenderer`;
});

ipcMain.handle(
  "windows",
  (_): unknown => {
    try {
      return BrowserWindow.getAllWindows().map(c => c.webContents);
    } catch {}
  },
);
