import { useEffect, useRef, useState } from "react";
import {
  broadcastSnapshot,
  createDisplayChannel,
  createDisplaySnapshot,
} from "./displaySync.js";

export function useDisplayPublisher({
  activitySetup,
  timerState,
  manualDirectionIndex,
}) {
  const channelRef = useRef(null);
  const versionRef = useRef(0);
  const [lastPublishedAt, setLastPublishedAt] = useState(null);

  useEffect(() => {
    channelRef.current = createDisplayChannel();
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    versionRef.current += 1;

    const snapshot = createDisplaySnapshot({
      activitySetup,
      timerState,
      manualDirectionIndex,
      version: versionRef.current,
    });

    broadcastSnapshot(channelRef.current, snapshot);
    setLastPublishedAt(snapshot.updatedAt);
  }, [activitySetup, timerState, manualDirectionIndex]);

  return { lastPublishedAt };
}
