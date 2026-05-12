/**
 * Main Page Component - PIR8 Battle Arena
 */

"use client";

import GameShell from "@/components/GameShell";
import { StartupDiagnostics } from "@/lib/startupDiagnostics";

export default function Home() {
  return (
    <>
      <StartupDiagnostics />
      <GameShell />
    </>
  );
}
