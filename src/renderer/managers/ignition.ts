import { error, log } from "@logger";
import { ready as commonReady } from "@common";
import { ready as componentsReady } from "../modules/components";
import * as coremods from "./coremods";
import * as plugins from "./plugins";
import * as themes from "./themes";
import * as quickCSS from "./quick-css";
import { loadStyleSheet } from "../util";
import { startAutoUpdateChecking } from "./updater";
import { interceptChunksGlobal } from "../modules/webpack/patch-load";

export async function start(): Promise<void> {
  log("Ignition", "Start", void 0, "Igniting Replugged...");
  const startTime = performance.now();

  loadStyleSheet("replugged://renderer.css");
  await import("../modules/i18n")
    .then((i18n) => i18n.load())
    .catch((err) => error("Ignition", "Start", void 0, "Error Loading i18n", err));

  let started = false;
  await Promise.race([
    Promise.all([
      themes.loadMissing().then(themes.loadAll),
      coremods.startAll(),
      plugins.startAll(),
    ]),
    // Failsafe to ensure that we always start Replugged
    new Promise((resolve) =>
      setTimeout(() => {
        if (!started) {
          error("Ignition", "Start", void 0, "Ignition timed out after 10 seconds");
          resolve(void 0);
        }
      }, 10_000),
    ),
  ]);
  started = true;

  // Quick CSS needs to be called after themes are loaded so that it will override the theme's CSS
  quickCSS.load();
  RepluggedNative.quickCSS.addListener(() => quickCSS.reload());

  // Want to make sure all addons are initialized before starting auto-update checking
  startAutoUpdateChecking();

  log(
    "Ignition",
    "Start",
    void 0,
    `Finished igniting Replugged in ${(performance.now() - startTime).toFixed(2)}ms`,
  );
}

export async function stop(): Promise<void> {
  log("Ignition", "Stop", void 0, "De-igniting Replugged...");
  const startTime = performance.now();

  quickCSS.unload();
  themes.unloadAll();
  await Promise.all([coremods.stopAll(), plugins.stopAll()]);

  log(
    "Ignition",
    "Stop",
    void 0,
    `Finished de-igniting Replugged in ${(performance.now() - startTime).toFixed(2)}ms`,
  );
}

export async function restart(): Promise<void> {
  await stop();
  await start();
}

/*
Load order:
1. Register all plaintext patches
2. await waitForReady from webpack
3. signalStart()
4. await reactReady
5. Start coremods, plugins, and themes
*/

export function ignite(): void {
  // This is the function that will be called when loading the window.
  // Plaintext patches must run first.

  interceptChunksGlobal();

  coremods.runPlaintextPatches();
  plugins.loadAll();
  plugins.runPlaintextPatches();

  // At this point, Discord's code should run.
  // Wait for the designated common modules to load before continuing.
  void Promise.all([commonReady(), componentsReady()]).then(() => start());
}

export function startSplash(): void {
  log("Ignition", "Start", void 0, "Igniting Replugged Splash Screen...");
  const startTime = performance.now();

  void themes.loadMissing().then(() => themes.loadAllSplash());

  log(
    "Ignition",
    "Start",
    void 0,
    `Finished igniting Replugged Splash Screen in ${performance.now() - startTime}ms`,
  );
}
