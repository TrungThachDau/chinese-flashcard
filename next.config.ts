import type { NextConfig } from "next";
import { execSync } from "child_process";
import packageJson from "./package.json";

function getCommitHash(): string {
  const configuredHash = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH;
  if (configuredHash) return configuredHash;

  const vercelHash = process.env.VERCEL_GIT_COMMIT_SHA;
  if (vercelHash) return vercelHash.slice(0, 7);

  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

function getCommitDate(): string {
  if (process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || process.env.VERCEL_GIT_COMMIT_SHA) {
    return "";
  }

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
  async redirects() {
    return [
      {
        source: "/cards",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
