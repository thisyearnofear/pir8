#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { Keypair } = require("@solana/web3.js");

const root = process.cwd();

const paths = {
  anchorToml: path.join(root, "Anchor.toml"),
  rustLib: path.join(root, "programs/pir8-game/src/lib.rs"),
  deployKeypair: path.join(root, "target/deploy/pir8_game-keypair.json"),
  targetIdl: path.join(root, "target/idl/pir8_game.json"),
  publicIdl: path.join(root, "public/idl/pir8_game.json"),
  envLocal: path.join(root, ".env.local"),
  envExample: path.join(root, ".env.local.example"),
};

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function extractProgramIdFromRust(source) {
  const match = source.match(/declare_id!\("([1-9A-HJ-NP-Za-km-z]{32,44})"\)/);
  return match?.[1] || null;
}

function extractProgramIdsFromAnchorToml(source) {
  return [...source.matchAll(/pir8_game\s*=\s*"([1-9A-HJ-NP-Za-km-z]{32,44})"/g)].map((m) => m[1]);
}

function extractProgramIdFromEnv(source) {
  const match = source.match(/^NEXT_PUBLIC_PROGRAM_ID=(.+)$/m);
  return match?.[1]?.trim() || null;
}

function extractProgramIdFromIdl(source) {
  const parsed = JSON.parse(source);
  return parsed.address || parsed.metadata?.address || null;
}

function extractDeployKeypairPubkey(file) {
  const secret = JSON.parse(read(file));
  return Keypair.fromSecretKey(Uint8Array.from(secret)).publicKey.toBase58();
}

function getAnchorVersion() {
  const anchorToml = read(paths.anchorToml);
  const match = anchorToml.match(/anchor_version\s*=\s*"([^"]+)"/);
  return match?.[1] || null;
}

function getInstalledAnchorVersion() {
  try {
    const output = execSync("anchor --version", { encoding: "utf8" }).trim();
    const match = output.match(/anchor-cli\s+([0-9.]+)/);
    return match?.[1] || output;
  } catch {
    return null;
  }
}

const rustId = extractProgramIdFromRust(read(paths.rustLib));
const anchorIds = extractProgramIdsFromAnchorToml(read(paths.anchorToml));
const envId = extractProgramIdFromEnv(read(paths.envLocal));
const targetIdlId = extractProgramIdFromIdl(read(paths.targetIdl));
const publicIdlId = extractProgramIdFromIdl(read(paths.publicIdl));
const keypairId = extractDeployKeypairPubkey(paths.deployKeypair);
const pinnedAnchorVersion = getAnchorVersion();
const installedAnchorVersion = getInstalledAnchorVersion();

const canonical = rustId;
const checks = [
  ["Rust declare_id", rustId],
  ["Deploy keypair", keypairId],
  [".env.local NEXT_PUBLIC_PROGRAM_ID", envId],
  ["target IDL address", targetIdlId],
  ["public IDL address", publicIdlId],
  ...anchorIds.map((id, index) => [`Anchor.toml program ID #${index + 1}`, id]),
];

let ok = true;
console.log("PIR8 predeploy consistency check\n");
console.log(`Canonical program ID: ${canonical}\n`);

for (const [label, value] of checks) {
  const pass = value === canonical;
  console.log(`${pass ? "OK " : "ERR"} ${label}: ${value}`);
  if (!pass) ok = false;
}

if (!pinnedAnchorVersion) {
  console.log("ERR Anchor.toml missing [toolchain].anchor_version");
  ok = false;
} else {
  const versionPass = installedAnchorVersion === pinnedAnchorVersion;
  console.log(`${versionPass ? "OK " : "ERR"} Anchor CLI version: installed=${installedAnchorVersion} pinned=${pinnedAnchorVersion}`);
  if (!versionPass) ok = false;
}

if (!fs.existsSync(paths.envExample)) {
  console.log("ERR .env.local.example missing");
  ok = false;
}

if (!ok) {
  process.exit(1);
}
