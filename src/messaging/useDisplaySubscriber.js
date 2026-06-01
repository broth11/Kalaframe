import { useEffect, useState } from "react";
import {
  createDisplayChannel,
  DISPLAY_POLL_INTERVAL_MS,
  isNewerSnapshot,
  readDisplaySnapshot,
} from "./displaySync.js";

export function useDisplaySubscriber() {
  const [snapshot, setSnapshot] = useState(() => readDisplaySnapshot());
  const [lastReceivedAt, setLastReceivedAt] = useState(() => snapshot?.updatedAt ?? null);

  useEffect(() => {
    const channel = createDisplayChannel();

    function applySnapshot(nextSnapshot) {
      setSnapshot((current) => {
        if (isNewerSnapshot(nextSnapshot, current)) {
          setLastReceivedAt(Date.now());
          return nextSnapshot;
        }
        return current;
      });
    }

    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.type === "KALAFRAME_DISPLAY_SNAPSHOT") {
          applySnapshot(event.data.payload);
        }
      };
    }

    function handleStorage(event) {
      if (event.key) {
        const polled = readDisplaySnapshot();
        if (polled) applySnapshot(polled);
      }
    }

    window.addEventListener("storage", handleStorage);

    const pollId = window.setInterval(() => {
      const polled = readDisplaySnapshot();
      if (polled) applySnapshot(polled);
    }, DISPLAY_POLL_INTERVAL_MS);

    return () => {
      channel?.close();
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(pollId);
    };
  }, []);

  return { snapshot, lastReceivedAt };
}
