import fs from "fs";
import { execSync } from "child_process";

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  );
}

function commandExists(command) {
  try {
    execSync(`command -v ${command}`, { stdio: "ignore", shell: "/bin/zsh" });
    return true;
  } catch {
    return false;
  }
}

function run(command, options = {}) {
  execSync(command, { stdio: "inherit", shell: "/bin/zsh", ...options });
}

function ensureDockerOnMac() {
  if (process.platform !== "darwin") return true;

  if (commandExists("docker")) {
    try {
      execSync("docker info", { stdio: "ignore", shell: "/bin/zsh" });
      return true;
    } catch {
      console.log("Docker is installed but not running. Trying to open Docker Desktop...");
      try {
        run("open -a Docker");
      } catch {
        return false;
      }
      return false;
    }
  }

  if (commandExists("brew")) {
    console.log("Docker CLI is missing. Installing Docker Desktop with Homebrew...");
    try {
      run("brew install --cask docker");
      run("open -a Docker");
      return false;
    } catch {
      return false;
    }
  }

  return false;
}

function ensureSupabaseCli() {
  if (commandExists("supabase")) return true;

  if (process.platform === "darwin" && commandExists("brew")) {
    console.log("Supabase CLI is missing. Installing it with Homebrew...");
    try {
      run("brew install supabase/tap/supabase");
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

const env = readEnvFile(".env.local");
const requiredKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
];

const missing = requiredKeys.filter((key) => !env[key]);
if (missing.length > 0) {
  console.error(`Missing required keys in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const dockerReady = ensureDockerOnMac();
const supabaseReady = ensureSupabaseCli();

if (!supabaseReady) {
  console.error("Supabase CLI is not available. Install it and rerun this script.");
  process.exit(1);
}

if (!dockerReady) {
  console.error("Docker Desktop needs to be installed and running before Supabase can start.");
  process.exit(1);
}

try {
  run("supabase start");
  console.log("Local Supabase is up. Next, run: npm run dev");
} catch (error) {
  process.exit(error.status || 1);
}
