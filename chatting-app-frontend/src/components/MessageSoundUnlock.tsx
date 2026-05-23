"use client";

import { useEffect } from "react";
import { unlockMessageSound } from "@/lib/messageSound";

/** Unlocks Web Audio after the first user interaction (browser autoplay policy). */
export function MessageSoundUnlock() {
  useEffect(() => {
    const unlock = () => unlockMessageSound();

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
