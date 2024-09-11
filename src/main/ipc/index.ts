import { ipcMain } from "electron";
import { readFileSync } from "fs";
import { join } from "path";
import "./plugins";
import "./themes";
import "./quick-css";
import "./settings";
import "./installer";
import "./i18n";
import "./react-devtools";
import { RepluggedIpcChannels, type RepluggedWebContents } from "../../types";

ipcMain.on(RepluggedIpcChannels.GET_DISCORD_PRELOAD, (event) => {
  event.returnValue = (event.sender as RepluggedWebContents).originalPreload;
});

ipcMain.on(RepluggedIpcChannels.GET_REPLUGGED_RENDERER, (event) => {
  const renderer = readFileSync(join(__dirname, "./renderer.js"), "utf-8");
  event.returnValue = `(async function(){ ${renderer} })().catch(console.error)\n\n//# sourceURL=RepluggedRenderer`;
});
