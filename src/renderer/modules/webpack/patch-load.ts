import type {
  WebpackChunk,
  WebpackChunkGlobal,
  WebpackRawModules,
  WebpackRequire,
} from "../../../types";

import { listeners } from "./lazy";

import { patchModuleSource } from "./plaintext-patch";

/**
 * Webpack's require function
 * @internal
 * @hidden
 */
export let wpRequire: WebpackRequire | undefined;
<<<<<<< HEAD
export let webpackChunks: WebpackRawModules | undefined;
=======
>>>>>>> 42122585199d52a1f134641c27b0cbf81cebbada

const patchedModules = new Set<string>();

/**
 * Original stringified module (without plaintext patches applied) for source searches
 * @internal
 * @hidden
 */
export const sourceStrings: Record<number, string> = {};

function patchChunk(chunk: WebpackChunk): void {
  const modules = chunk[1];
  for (const id in modules) {
    if (patchedModules.has(id)) continue;
    patchedModules.add(id);
    const originalMod = modules[id];
    sourceStrings[id] = originalMod.toString();
    const mod = patchModuleSource(originalMod, id);
    modules[id] = function (module, exports, require) {
      mod(module, exports, require);

      for (const [filter, callback] of listeners) {
        try {
          if (filter(module)) {
            callback(module);
          }
        } catch {}
      }
    };
    modules[id].toString = () => sourceStrings[id];
  }
}

/**
 * Patch the push method of window.webpackChunkdiscord_app
 * @param webpackChunk Webpack chunk global
 * @internal
 */
function patchPush(webpackChunk: WebpackChunkGlobal): void {
  let original = webpackChunk.push;

  function handlePush(chunk: WebpackChunk): unknown {
    patchChunk(chunk);
    return original.call(webpackChunk, chunk);
  }

  // From YofukashiNo: https://discord.com/channels/1000926524452647132/1000955965304221728/1258946431348375644
  handlePush.bind = original.bind.bind(original);

  Object.defineProperty(webpackChunk, "push", {
    get: () => handlePush,
    set: (v) => (original = v),
    configurable: true,
  });
}

/**
 * Modify the webpack chunk global and signal it to begin operations
 * @param webpackChunk Webpack chunk global
 * @internal
 */
function loadWebpackModules(chunksGlobal: WebpackChunkGlobal): void {
  patchPush(chunksGlobal);
  chunksGlobal.push([
    [Symbol("replugged")],
    {},
    (r: WebpackRequire | undefined) => {
      wpRequire = r!;
      if (wpRequire.c && !webpackChunks) webpackChunks = wpRequire.c;

      if (r) {
        // The first batch of modules are added inline via r.m rather than being pushed

        r.d = (module: unknown, exports: Record<string, () => unknown>) => {
          for (const prop in exports) {
            if (
              Object.hasOwnProperty.call(exports, prop) &&
              !Object.hasOwnProperty.call(module, prop)
            ) {
              Object.defineProperty(module, prop, {
                enumerable: true,
                configurable: true,
                get: () => exports[prop](),
                set: (value) => (exports[prop] = () => value),
              });
            }
          }
        };

        patchChunk([[], wpRequire!.m]);
      }
    },
  ]);

  // Patch previously loaded chunks
  if (Array.isArray(chunksGlobal)) {
    for (const loadedChunk of chunksGlobal) {
      patchChunk(loadedChunk);
    }
  }
}

// Intercept the webpack chunk global as soon as Discord creates it
export function interceptChunksGlobal(): void {
  if (window.webpackChunkdiscord_app) {
    loadWebpackModules(window.webpackChunkdiscord_app);
  } else {
    let webpackChunk: WebpackChunkGlobal | undefined;
    Object.defineProperty(window, "webpackChunkdiscord_app", {
      get: () => webpackChunk,
      set: (v) => {
        // Only modify if the global has actually changed
        // We don't need to check if push is the special webpack push,
        // because webpack will go over the previously loaded modules
        // when it sets the custom push method.
        if (v !== webpackChunk) {
          // setTimeout(() => {
          loadWebpackModules(v);
          // }, 0);
        }
        webpackChunk = v;
      },
      configurable: true,
    });
  }
  // eslint-disable-next-line no-extend-native, accessor-pairs
  Object.defineProperty(Function.prototype, "m", {
    configurable: true,

    set(v: unknown) {
      Object.defineProperty(this, "m", {
        value: v,
        configurable: true,
        enumerable: true,
        writable: true,
      });

      // When using react devtools or other extensions, we may also catch their webpack here.
      // This ensures we actually got the right one
      const { stack } = new Error();
      if (
        !(stack?.includes("discord.com") || stack?.includes("discordapp.com")) ||
        Array.isArray(v)
      ) {
        return;
      }

      const fileName = stack.match(/\/assets\/(.+?\.js)/)?.[1] ?? "";
      console.log("Found Webpack module factory", fileName);

      patchChunk([[], v]);
    },
  });
}
