const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const expoCommand = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "expo.cmd" : "expo",
);

const env = { ...process.env };

// Replit supplies these values through its managed workflow. Outside Replit,
// Expo runs normally without them.
if (!env.EXPO_PUBLIC_DOMAIN && env.REPLIT_DEV_DOMAIN) {
  env.EXPO_PUBLIC_DOMAIN = env.REPLIT_DEV_DOMAIN;
}
if (!env.EXPO_PUBLIC_REPL_ID && env.REPL_ID) {
  env.EXPO_PUBLIC_REPL_ID = env.REPL_ID;
}
if (!env.REACT_NATIVE_PACKAGER_HOSTNAME && env.REPLIT_DEV_DOMAIN) {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = env.REPLIT_DEV_DOMAIN;
}
if (!env.EXPO_PACKAGER_PROXY_URL && env.REPLIT_EXPO_DEV_DOMAIN) {
  env.EXPO_PACKAGER_PROXY_URL = `https://${env.REPLIT_EXPO_DEV_DOMAIN}`;
}

const args = ["start"];
if (env.PORT) {
  args.push("--localhost", "--port", env.PORT);
}

const child = spawn(expoCommand, args, {
  cwd: projectRoot,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("error", (error) => {
  console.error(`Unable to start Expo: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});