import {
  getHausnerQualityBands,
  getRelationshipRows,
} from "../../lib/data";
import type { AtlasData, Sample } from "../../lib/types";
import RelationshipScatterChart from "./RelationshipScatterChart";

export default function HausnerMoistureChart({
  data,
  samples,
}: {
  data: AtlasData;
  samples: Sample[];
}) {
  const rows = getRelationshipRows(
    samples.map((sample) => sample.sample_id),
    data.samples,
    data.measurements,
    "moisture",
    "hausnerRatio",
  );

  return (
    <RelationshipScatterChart
      title="Moisture vs Hausner Ratio"
      subtitle="Sample states are connected by alloy to show how moisture drift may affect flowability."
      rows={rows}
      xAxisLabel="KF Moisture Content (ppm)"
      yAxisLabel="Hausner Ratio (-)"
      yBands={getHausnerQualityBands()}
      yThresholds={[1.1, 1.2, 1.25]}
    />
  );
}
