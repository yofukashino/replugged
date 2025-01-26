import * as replugged from "./replugged";

window.replugged = replugged;

// Splash screen

if (!window.location.hostname.includes("discord.com")) {
  replugged.ignition.startSplash();
} else {
  replugged.ignition.ignite();
}
