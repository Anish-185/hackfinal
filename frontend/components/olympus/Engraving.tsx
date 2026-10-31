import type { CSSProperties } from "react";
import { ENGRAVINGS, type EngravingName } from "@/lib/olympus/engravings";

type Props = {
  name: EngravingName;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; omit for decorative art (hidden from assistive tech). */
  label?: string;
  /** Gold light sweeps across on hover of the nearest .engr-host. */
  sheen?: boolean;
};

/** An engraving from the theme sheets, filled with currentColor (or --engr) through a CSS mask. */
export default function Engraving({ name, className = "", style, label, sheen }: Props) {
  const [w, h] = ENGRAVINGS[name];
  const url = `url(/engravings/${name}.webp)`;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`engr ${sheen ? "engr-sheen" : ""} ${className}`}
      style={{ aspectRatio: `${w} / ${h}`, WebkitMaskImage: url, maskImage: url, ...style }}
    />
  );
}
