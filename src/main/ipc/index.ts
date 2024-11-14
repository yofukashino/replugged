import { BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { readFileSync } from "fs";
import "./themes";
import "./installer";
import "./settings";
import "./plugins";
import "./quick-css";
import "./react-devtools";

import { RepluggedIpcChannels, type RepluggedWebContents } from "../../types";

ipcMain.on(RepluggedIpcChannels.GET_DISCORD_PRELOAD, (event) => {
  event.returnValue = (event.sender as RepluggedWebContents).originalPreload;
});

ipcMain.on(RepluggedIpcChannels.GET_REPLUGGED_RENDERER, (event) => {
  event.returnValue = `(async function(){ ${readFileSync(join(__dirname, "./renderer.js"), "utf-8")} })().catch(console.error)\n\n//# sourceURL=RepluggedRenderer`;
});

ipcMain.on("echo", (event, str: string) => {
  event.returnValue = str;
});
