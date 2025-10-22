import semver from "semver";
import { cpSync, existsSync, readdirSync, renameSync } from "original-fs";
import { basename, join } from "path";
import { getSetting } from "./ipc/settings";

function getPathBefore(path: string, before: string): string {
  return join(path.substring(0, path.indexOf(before.replace("/", "\\"))));
}

export default function patchAutoStartUpdate(): void {
  const winUpdater = getSetting<boolean>("dev.replugged.Settings", "winUpdater", true);
  if (process.platform !== "win32" || !winUpdater) return;

  try {
    const mainPath = require.main?.filename;
    if (!mainPath) return;

    const origAsarPath = getPathBefore(mainPath, "/app_bootstrap/index");
    const currentAsarDir = join(origAsarPath, "../app.asar");
    const currentVersion = basename(getPathBefore(origAsarPath, "/resources/app.asar"));
    const discordRoot = getPathBefore(origAsarPath, `${currentVersion}/resources`);
    const autoStartPath = join(mainPath, "../autoStart/index.js");

    const autoStart = require(autoStartPath);
    const originalUpdate = autoStart.update;

    if (typeof originalUpdate !== "function") return;

    // Patch update function
    require.cache[autoStartPath]!.exports.update = async (callback?: () => void) => {
      const newVersion = readdirSync(discordRoot).reduce((oldVersionString, newVersionString) => {
        if (!newVersionString.startsWith("app-")) return oldVersionString;
        const oldVersion = semver.clean(oldVersionString)!;
        const newVersion = semver.clean(newVersionString)!;
        if (semver.compare(oldVersion, newVersion) === -1) return newVersionString;
        return oldVersionString;
      }, currentVersion);

      if (newVersion === currentVersion) return;

      const newResources = join(discordRoot, newVersion, "resources");
      const newAsar = join(newResources, "app.asar");
      const newOrigAsar = join(newResources, "app.orig.asar");

      try {
        if (!existsSync(newOrigAsar) && existsSync(newAsar)) {
          renameSync(newAsar, newOrigAsar);
        }

        // Copy current asar folder into new version
        cpSync(currentAsarDir, newAsar, { recursive: true });
      } catch (err) {
        console.error("Failed to patch new version:", err);
      }

      await originalUpdate(callback);
    };
  } catch (err) {
    console.error("Failed to patch autoStart updater:", err);
  }
}
