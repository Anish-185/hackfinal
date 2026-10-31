// Engravings cut from the team's asset sheets by scripts/cut-greek.mjs (2x the sheet
// resolution). Sizes are the files' pixel sizes, used for aspect ratios.
export const GREEK = {
  athena: [628, 976],
  pegasus: [744, 680],
  sun: [336, 328],
  moon: [216, 284],
  sky: [448, 452],
  arch: [476, 572],
  helmet: [256, 392],
  ionic: [292, 232],
  corinthian: [264, 256],
  column: [192, 404],
  ship: [700, 340],
  amphora: [276, 352],
  bull: [320, 332],
  hermes: [436, 520],
  wreath: [280, 264],
  "wreath-bow": [280, 280],
  scroll: [256, 348],
  compass: [268, 308],
  torch: [112, 352],
  aegis: [320, 320],
  coast: [1288, 472],
} as const;

export type GreekName = keyof typeof GREEK;

/** Greek numerals for section labels: Α΄ Β΄ Γ΄ … (Ϛ is six). */
export const NUMERALS = ["Α", "Β", "Γ", "Δ", "Ε", "Ϛ", "Ζ", "Η", "Θ", "Ι"];
