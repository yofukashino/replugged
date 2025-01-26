import { BrowserWindow, ipcMain } from "electron";
import { RepluggedIpcChannels } from "../../types";

let backgroundMaterial: "auto" | "none" | "mica" | "acrylic" | "tabbed" | null = null;
ipcMain.handle(
  RepluggedIpcChannels.GET_BACKGROUND_MATERIAL,
  (): "auto" | "none" | "mica" | "acrylic" | "tabbed" | null => {
    return backgroundMaterial;
  },
);

ipcMain.handle(
  RepluggedIpcChannels.SET_BACKGROUND_MATERIAL,
  (_, material: "auto" | "none" | "mica" | "acrylic" | "tabbed" | null) => {
    let windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      // @ts-expect-error standalone-electron-types is not updated to have this.
      window.setBackgroundMaterial(typeof material === "string" ? material : "none");
    });
    backgroundMaterial = material;
  },
);

let currentVibrancy: Parameters<typeof BrowserWindow.prototype.setVibrancy>[0] = null;
ipcMain.handle(
  RepluggedIpcChannels.GET_VIBRANCY,
  (): Parameters<typeof BrowserWindow.prototype.setVibrancy>[0] => currentVibrancy,
);

ipcMain.handle(
  RepluggedIpcChannels.SET_VIBRANCY,
  (_, vibrancy: Parameters<typeof BrowserWindow.prototype.setVibrancy>[0]) => {
    let windows = BrowserWindow.getAllWindows();

    windows.forEach((window) => window.setVibrancy(vibrancy));
    currentVibrancy = vibrancy;
  },
);

let currentBackgroundColor = "#00000000";
ipcMain.handle(RepluggedIpcChannels.GET_BACKGROUND_COLOR, (): string => {
  return currentBackgroundColor;
});

ipcMain.handle(RepluggedIpcChannels.SET_BACKGROUND_COLOR, (_, color: string | undefined) => {
  let windows = BrowserWindow.getAllWindows();
  windows.forEach((window) => window.setBackgroundColor(color || "#00000000"));
  currentBackgroundColor = color || "#00000000";
});
