"use client";

import { useEffect } from "react";

const START_MARK = "pir8:start";
const SHELL_MOUNT_MARK = "pir8:game-shell-mounted";
const SHELL_MOUNT_MEASURE = "pir8:time-to-game-shell";

function reportStartupIssue(type: string, details: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const payload = {
    type,
    details,
    href: window.location.href,
    userAgent: window.navigator.userAgent,
    timestamp: Date.now(),
  };

  console.warn("[pir8][startup]", payload);
}

export function markStartupStart() {
  if (typeof performance === "undefined") return;
  performance.mark(START_MARK);
}

export function markGameShellMounted() {
  if (typeof performance === "undefined") return;

  performance.mark(SHELL_MOUNT_MARK);

  try {
    performance.measure(SHELL_MOUNT_MEASURE, START_MARK, SHELL_MOUNT_MARK);
  } catch {
    // Ignore duplicate or missing marks.
  }
}

export function StartupDiagnostics() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    markStartupStart();

    const onError = (event: ErrorEvent) => {
      reportStartupIssue("window-error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportStartupIssue("unhandled-rejection", {
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === "string"
              ? reason
              : "Unknown rejection",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    let observer: PerformanceObserver | null = null;

    if (
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes?.includes("longtask")
    ) {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration >= 250) {
            reportStartupIssue("long-task", {
              name: entry.name,
              duration: Math.round(entry.duration),
              startTime: Math.round(entry.startTime),
            });
          }
        }
      });

      observer.observe({ entryTypes: ["longtask"] });
    }

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      observer?.disconnect();
    };
  }, []);

  return null;
}
