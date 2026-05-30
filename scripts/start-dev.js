const { spawn } = require("child_process");

const children = [];
let isShuttingDown = false;

const spawnScript = (name, script) => {
  const child = spawn("npm", ["run", script], {
    stdio: "inherit",
    shell: true,
  });

  children.push(child);

  child.on("exit", (code) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`[dev] ${name} exited with code ${code ?? 0}. Stopping others...`);
    for (const proc of children) {
      if (!proc.killed) proc.kill();
    }
    process.exit(code ?? 0);
  });
};

const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  for (const proc of children) {
    if (!proc.killed) proc.kill();
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

spawnScript("AI Proxy", "ai:bytez");
spawnScript("React App", "start:web");

