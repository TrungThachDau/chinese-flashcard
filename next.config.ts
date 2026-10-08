import type { NextConfig } from "next";
import { execSync } from "child_process";
import packageJson from "./package.json";

function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return (
      process.env.NEXT_PUBLIC_GIT_COMMIT_HASH ||
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      "dev"
    );
  }
}

function getCommitDate(): string {
  try {
    return execSync("git log -1 --format=%cs").toString().trim();
  } catch {
    return "";
  }
}

const commitHash = getCommitHash();
const commitDate = getCommitDate();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_GIT_COMMIT_HASH: commitHash,
    NEXT_PUBLIC_GIT_COMMIT_DATE: commitDate,
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
