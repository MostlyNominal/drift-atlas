export const chartColors = [
  "#006f6f",
  "#b56b12",
  "#8d3f5c",
  "#4f6f3a",
  "#355c7d",
  "#7a5c99",
];

export const axisStyle = {
  fill: "#64706a",
  fontSize: 12,
};

export const gridStroke = "#d8dfd7";

export function sampleColor(index: number): string {
  return chartColors[index % chartColors.length];
}
