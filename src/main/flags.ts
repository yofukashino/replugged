import { app } from "electron";
const enabledFeatures = app.commandLine.getSwitchValue("enable-features").split(",");
// Discord already disables UseEcoQoSForBackgroundProcess and some other
// related features
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

// already added on Windows, but not on other operating systems
app.commandLine.appendSwitch("disable-background-timer-throttling");

enabledFeatures.push("Vulkan", "DefaultANGLEVulkan", "VulkanFromANGLE");

if (process.platform === "linux") {
  app.commandLine.appendSwitch("enable-blink-features", "MiddleClickAutoscroll");

  app.commandLine.appendSwitch("enable-speech-dispatcher");

  enabledFeatures.push("PlatformHEVCDecoderSupport");
}

// NOTE: Only tested if this appears on Windows, it should appear on all when
//       hardware acceleration is disabled
const noAccel = app.commandLine.hasSwitch("disable-gpu-compositing");
if (!noAccel) {
  if (process.platform === "linux") {
    // These will eventually be renamed https://source.chromium.org/chromium/chromium/src/+/5482210941a94d70406b8da962426e4faca7fce4
    enabledFeatures.push("VaapiVideoEncoder", "VaapiVideoDecoder", "VaapiVideoDecodeLinuxGL");

    enabledFeatures.push("VaapiIgnoreDriverChecks");
  }
}

app.commandLine.appendSwitch("enable-features", [...new Set(enabledFeatures)].join(","));
