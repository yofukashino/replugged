import { dirname, join } from "path";
import { existsSync } from "fs";

// This is for backwards compatibility, to be removed later.
let discordPath = join(dirname(require.main!.filename), "..", "app.orig.asar");
if (existsSync(discordPath)) {
  const discordPackage: Record<string, string> = require(join(discordPath, "package.json"));
  require.main!.filename = join(discordPath, discordPackage.main);
} else {
  // If using newer replugged file system
  discordPath = join(dirname(require.main!.filename), "index.orig.js");
}

require("./replugged");

require(discordPath);
