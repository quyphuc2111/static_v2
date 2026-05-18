/**
 * Cross-platform dev setup script.
 * Works on macOS, Windows, and Linux.
 * 
 * Usage: node scripts/dev-setup.js
 */

import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();

function log(msg) {
  console.log(`\x1b[36m[setup]\x1b[0m ${msg}`);
}

function warn(msg) {
  console.log(`\x1b[33m[warn]\x1b[0m ${msg}`);
}

function error(msg) {
  console.error(`\x1b[31m[error]\x1b[0m ${msg}`);
}

function run(cmd, opts = {}) {
  log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
  } catch (e) {
    error(`Command failed: ${cmd}`);
    if (!opts.ignoreError) process.exit(1);
  }
}

async function main() {
  log("🚀 Starting cross-platform dev setup...");
  log(`Platform: ${process.platform} | Arch: ${process.arch}`);

  // 1. Check .env file
  const envPath = path.join(ROOT, ".env");
  const envExamplePath = path.join(ROOT, "env.example");

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log("✅ Created .env from env.example");
    } else {
      warn("⚠️  No env.example found. Please create .env manually.");
    }
  } else {
    log("✅ .env already exists");
  }

  // 2. Ensure uploads directory exists
  const uploadsDir = path.join(ROOT, "static", "uploads");
  await fs.ensureDir(uploadsDir);
  log("✅ Ensured static/uploads directory exists");

  // 3. Install dependencies
  log("📦 Installing dependencies...");
  run("pnpm install");

  // 4. Generate Prisma client (with correct binary for current OS)
  log("🔧 Generating Prisma client...");
  run("npx prisma generate");

  // 5. Check Docker availability for database
  try {
    execSync("docker --version", { stdio: "pipe" });
    log("✅ Docker is available");
    log("💡 Run 'pnpm db:up' to start the MySQL container");
  } catch {
    warn("⚠️  Docker not found. You'll need MySQL running locally or via another method.");
    warn("   Update DATABASE_URL in .env to point to your MySQL instance.");
  }

  log("");
  log("🎉 Setup complete! Next steps:");
  log("   1. pnpm run db:up          → Start MySQL container");
  log("   2. pnpm run prisma:migrate → Run database migrations");
  log("   3. pnpm run prisma:seed    → Seed initial data");
  log("   4. pnpm run dev            → Start dev server");
}

main().catch((e) => {
  error(e.message);
  process.exit(1);
});
