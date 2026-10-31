import { useEffect, useRef, useState } from "react";

/** Counts down to `endsAt`, corrected by the client/server clock offset. */
export default function Timer({ endsAt, clockOffsetMs = 0, onExpire }) {
  const end = new Date(endsAt).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(end - (Date.now() + clockOffsetMs), 0));
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(end - (Date.now() + clockOffsetMs), 0);
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        onExpireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [end, clockOffsetMs]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const text = `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <span className={`timer ${totalSeconds <= 300 ? "timer-low" : ""}`} aria-label="Time remaining">
      ⏱ {text}
    </span>
  );
}
