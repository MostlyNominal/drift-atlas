import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

// Thin ECharts wrapper. Swap to Plotly.js here if preferred — the explorer
// pages only depend on this component, not on ECharts directly.
export default function Chart({ option, height = 420 }: { option: EChartsOption; height?: number }) {
  return <ReactECharts option={option} style={{ height, width: "100%" }} notMerge lazyUpdate />;
}
