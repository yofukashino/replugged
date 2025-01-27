import { dirname, join } from "path";
import electron from "electron";

import { CONFIG_PATHS } from "src/util.mjs";
import { RepluggedIpcChannels, type RepluggedWebContents } from "../types";

import { getSetting } from "./ipc/settings";
import { statSync } from "fs";
export const Logger = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

const transparent: boolean = getSetting("dev.replugged.Settings", "transparentWindow", false);
const electronPath = require.resolve("electron");

let discordPath = join(dirname(require.main!.filename), "..", "app.orig.asar");
try {
  // If using older replugged file system
  statSync(discordPath);
  const discordPackage = require(join(discordPath, "package.json"));
  require.main!.filename = join(discordPath, discordPackage.main);
} catch {
  // If using newer replugged file system
  discordPath = join(dirname(require.main!.filename), "app.orig");
  const discordPackage = require(join(discordPath, "package.json"));
  require.main!.filename = join(discordPath, "..", discordPackage.main);
}

let customTitlebar: boolean = getSetting("dev.replugged.Settings", "titlebar", false);

Object.defineProperty(global, "appSettings", {
  set: (v /* : typeof global.appSettings*/) => {
    // cspell:ignore youre
    v.set("DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING", true);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    delete global.appSettings;
    global.appSettings = v;
  },
  get: () => global.appSettings,
  configurable: true,
});

enum DiscordWindowType {
  UNKNOWN,
  POP_OUT,
  SPLASH_SCREEN,
  OVERLAY,
  DISCORD_CLIENT,
}

type InternalBrowserWindowConstructorOptions = electron.BrowserWindowConstructorOptions & {
  webContents?: electron.WebContents;
  webPreferences?: {
    nativeWindowOpen: boolean;
  };
};

function windowTypeFromOpts(opts: InternalBrowserWindowConstructorOptions): DiscordWindowType {
  if (opts.webContents) {
    return DiscordWindowType.POP_OUT;
  } else if (opts.webPreferences?.nodeIntegration) {
    return DiscordWindowType.SPLASH_SCREEN;
  } else if (opts.webPreferences?.offscreen) {
    return DiscordWindowType.OVERLAY;
  } else if (opts.webPreferences?.preload) {
    if (opts.webPreferences.nativeWindowOpen) {
      return DiscordWindowType.DISCORD_CLIENT;
    } else {
      // Splash Screen on macOS (Host 0.0.262+) & Windows (Host 0.0.293 / 1.0.17+)
      return DiscordWindowType.DISCORD_CLIENT;
    }
  }

  return DiscordWindowType.UNKNOWN;
}

// This class has to be named "BrowserWindow" exactly
// https://github.com/discord/electron/blob/13-x-y/lib/browser/api/browser-window.ts#L60-L62
// Thank you, Ven, for pointing this out!
class BrowserWindow extends electron.BrowserWindow {
  public constructor(
    opts: electron.BrowserWindowConstructorOptions & {
      webContents?: electron.WebContents;
      webPreferences?: {
        nativeWindowOpen: boolean;
      };
    },
  ) {
    if (opts.frame && process.platform.includes("linux") && customTitlebar) opts.frame = void 0;

    const originalPreload = opts.webPreferences?.preload;

    const currentWindow = windowTypeFromOpts(opts);

    switch (currentWindow) {
      case DiscordWindowType.DISCORD_CLIENT: {
        opts.webPreferences!.preload = join(__dirname, "./preload.js");

        if (transparent) {
          switch (process.platform) {
            case "win32":
              opts.transparent = true;
              opts.backgroundColor = "#00000000";
              break;
            case "linux":
              opts.backgroundColor = "#00000000";
              opts.transparent = true;
              break;
          }
        }
        break;
      }
      case DiscordWindowType.SPLASH_SCREEN: {
        // opts.webPreferences.preload = join(__dirname, "./preloadSplash.js");
        break;
      }
      case DiscordWindowType.OVERLAY: {
        // opts.webPreferences.preload = join(__dirname, "./preload.js");
        break;
      }
    }

    super(opts);

    // Center the unmaximized location
    if (transparent) {
      const currentDisplay = electron.screen.getDisplayNearestPoint(
        electron.screen.getCursorScreenPoint(),
      );
      this.repluggedPreviousBounds.x =
        currentDisplay.workArea.width / 2 - this.repluggedPreviousBounds.width / 2;
      this.repluggedPreviousBounds.y =
        currentDisplay.workArea.height / 2 - this.repluggedPreviousBounds.height / 2;
      this.maximize = this.repluggedToggleMaximize;
      this.unmaximize = this.repluggedToggleMaximize;
    }

    (this.webContents as RepluggedWebContents).originalPreload = originalPreload;

    this.webContents.on("devtools-opened", () => {
      electron.nativeTheme.themeSource = "light";
      setTimeout(() => (electron.nativeTheme.themeSource = "dark"), 25);
    });

    Logger.log = (...args) => this.webContents.send(RepluggedIpcChannels.CONSOLE_LOG, ...args);
    Logger.warn = (...args) => this.webContents.send(RepluggedIpcChannels.CONSOLE_WARN, ...args);
    Logger.error = (...args) => this.webContents.send(RepluggedIpcChannels.CONSOLE_ERROR, ...args);
  }

  private repluggedPreviousBounds: Electron.Rectangle = {
    width: 1400,
    height: 900,
    x: 0,
    y: 0,
  };

  public repluggedToggleMaximize(): void {
    // Determine whether the display is actually maximized already
    let currentBounds = this.getBounds();
    const currentDisplay = electron.screen.getDisplayNearestPoint(
      electron.screen.getCursorScreenPoint(),
    );
    const workAreaSize = currentDisplay.workArea;
    if (
      currentBounds.width === workAreaSize.width &&
      currentBounds.height === workAreaSize.height
    ) {
      // Un-maximize
      this.setBounds(this.repluggedPreviousBounds);
      return;
    }

    this.repluggedPreviousBounds = this.getBounds();
    this.setBounds({
      x: workAreaSize.x + 1,
      y: workAreaSize.y + 1,
      width: workAreaSize.width,
      height: workAreaSize.height,
    });
  }
}

Object.defineProperty(BrowserWindow, "name", {
  value: "BrowserWindow",
  configurable: true,
});

const electronExports: typeof electron = new Proxy(electron, {
  get(target, prop) {
    switch (prop) {
      case "BrowserWindow":
        return BrowserWindow;
      // Trick Babel's polyfill thing into not touching Electron's exported object with its logic
      case "default":
        return electronExports;
      case "__esModule":
        return true;
      default:
        return target[prop as keyof typeof electron];
    }
  },
});

delete require.cache[electronPath]!.exports;
require.cache[electronPath]!.exports = electronExports;

(
  electron.app as typeof electron.app & {
    setAppPath: (path: string) => void;
  }
).setAppPath(discordPath);
// electron.app.name = discordPackage.name;

electron.protocol.registerSchemesAsPrivileged([
  {
    scheme: "replugged",
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
    },
  },
]);

function loadReactDevTools(): void {
  const rdtSetting = getSetting<boolean>("dev.replugged.Settings", "reactDevTools", false);

  if (rdtSetting) {
    void electron.session.defaultSession.loadExtension(CONFIG_PATHS["react-devtools"]);
  }
}

// Copied from old codebase
electron.app.once("ready", () => {
  electron.session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: [
        "https://*/api/v*/science",
        "https://*/api/v*/metrics",
        "https://*/api/v*/science/*",
        "https://*/api/v*/metrics/*",
        "https://sentry.io/*",
        "https://*/assets/sentry.*.js",
      ],
    },
    function (_details, callback) {
      callback({ cancel: true });
    },
  );
  // @todo: Whitelist a few domains instead of removing CSP altogether; See #386
  electron.session.defaultSession.webRequest.onHeadersReceived(({ responseHeaders }, done) => {
    if (!responseHeaders) {
      done({});
      return;
    }

    const hasFrameOptions = Object.keys(responseHeaders).find((e) => /x-frame-options/i.test(e));
    const hasAllowCredentials = Object.keys(responseHeaders).find((e) =>
      /access-control-allow-credentials/i.test(e),
    );

    const headersWithoutCSP = Object.fromEntries(
      Object.entries(responseHeaders).filter(
        ([k]) =>
          !/^x-frame-options/i.test(k) &&
          !/^content-security-policy/i.test(k) &&
          !(/^access-control-allow-origin$/i.test(k) && !hasAllowCredentials),
      ),
    );

    if (!hasAllowCredentials) {
      headersWithoutCSP["Access-Control-Allow-Origin"] = ["*"];
    }

    if (hasFrameOptions) {
      headersWithoutCSP["Content-Security-Policy"] = [
        "frame-ancestors 'self' https://discord.com https://*.discord.com https://*.discordsays.com;",
      ];
    }

    done({ responseHeaders: headersWithoutCSP });
  });

  loadReactDevTools();
});
electron.app.on("session-created", () => {
  electron.protocol.registerFileProtocol("replugged", (request, cb) => {
    let filePath = "";
    const reqUrl = new URL(request.url);
    switch (reqUrl.hostname) {
      case "renderer":
        filePath = join(__dirname, "./renderer.js");
        break;
      case "renderer.css":
        filePath = join(__dirname, "./renderer.css");
        break;
      case "quickcss":
        filePath = join(CONFIG_PATHS.quickcss, reqUrl.pathname);
        break;
      case "theme":
        filePath = join(
          reqUrl.pathname.includes(".asar") ? CONFIG_PATHS.temp_themes : CONFIG_PATHS.themes,
          reqUrl.pathname.replace(".asar", ""),
        );
        break;
      case "plugin":
        filePath = join(
          reqUrl.pathname.includes(".asar") ? CONFIG_PATHS.temp_plugins : CONFIG_PATHS.plugins,
          reqUrl.pathname.replace(".asar", ""),
        );

        break;
      case "assets":
        filePath = join(__dirname, reqUrl.pathname);
        break;
    }
    cb({ path: filePath });
  });

  loadReactDevTools();
});

// This module is required this way at runtime.
require("./ipc");

require(discordPath);
