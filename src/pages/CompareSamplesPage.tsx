import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MethodBadges,
  PageHeader,
  StatTile,
  TagList,
} from "../components/Common";
import {
  formatMetricValue,
  formatStatLine,
  getCompareMetricOrder,
  getRelationshipRows,
  getSampleKeyMetrics,
  getTapCurveSeries,
  metricDefinitions,
} from "../lib/data";
import AvalancheBoxPlot from "../components/charts/AvalancheBoxPlot";
import DensityEvolutionChart from "../components/charts/DensityEvolutionChart";
import EmptyChartState from "../components/charts/EmptyChartState";
import GroupedMetricChart from "../components/charts/GroupedMetricChart";
import HausnerMoistureChart from "../components/charts/HausnerMoistureChart";
import PSDCurveChart from "../components/charts/PSDCurveChart";
import RelationshipScatterChart from "../components/charts/RelationshipScatterChart";
import ScientificLineChart from "../components/charts/ScientificLineChart";
import type { AtlasData, MetricKey, MetricStat, Sample } from "../lib/types";

export default function CompareSamplesPage({ data }: { data: AtlasData }) {
  const location = useLocation();
  const querySample = new URLSearchParams(location.search).get("sample");
  const initialSelection = querySample && data.samples.some((sample) => sample.sample_id === querySample)
    ? [querySample, ...data.samples.filter((sample) => sample.sample_id !== querySample).slice(0, 1).map((sample) => sample.sample_id)]
    : data.samples.slice(0, 3).map((sample) => sample.sample_id);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection);

  const selectedSamples = data.samples.filter((sample) => selectedIds.includes(sample.sample_id));
  const comparedRows = useMemo(() => {
    return getCompareMetricOrder().map((metricKey) => ({
      metricKey,
      values: selectedSamples.map((sample) => ({
        sample,
        stat: getSampleKeyMetrics(sample, data.measurements, data.images, data.granudrumSeries)[metricKey],
      })),
    }));
  }, [data.granudrumSeries, data.images, data.measurements, selectedSamples]);
  const selectedSampleIds = selectedSamples.map((sample) => sample.sample_id);
  const selectedTapCurves = getTapCurveSeries(selectedSampleIds, data.granutapCurves);
  const d50HausnerRows = getRelationshipRows(
    selectedSampleIds,
    data.samples,
    data.measurements,
    "d50",
    "hausnerRatio",
  );
  const spanCarrRows = getRelationshipRows(
    selectedSampleIds,
    data.samples,
    data.measurements,
    "span",
    "carrIndex",
  );
  const speedSeries = data.granudrumSeries
    .filter((series) => selectedSampleIds.includes(series.sample_id) && series.test_type === "speed_hysteresis")
    .map((series) => {
      const sample = data.samples.find((candidate) => candidate.sample_id === series.sample_id);
      return {
        name: `${sample?.display_name ?? series.sample_id} repeat ${series.repeat}`,
        points: series.points ?? [],
      };
    });

  return (
    <div>
      <PageHeader
        eyebrow="Compare Samples"
        title="Powder comparison atlas"
        subtitle="Select two or more powder passports and compare PSD, moisture, tap density, flow proxies, and SEM coverage side by side."
      />

      <section className="sample-picker" aria-label="Choose samples to compare">
        {data.samples.map((sample) => {
          const checked = selectedIds.includes(sample.sample_id);
          return (
            <label key={sample.sample_id} className={checked ? "check-card checked" : "check-card"}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSample(sample.sample_id, setSelectedIds)}
              />
              <span>{sample.display_name}</span>
              <small>{sample.alloy} / {sample.powder_state}</small>
            </label>
          );
        })}
      </section>

      <section className="compare-cards">
        {selectedSamples.map((sample) => (
          <CompareCard
            key={sample.sample_id}
            sample={sample}
            data={data}
          />
        ))}
      </section>

      <section className="compare-visuals">
        <h2>Scientific Comparison</h2>
        <div className="chart-grid">
          <PSDCurveChart
            title="PSD Curve Overlay"
            subtitle="Mean repeat curves for selected powder states."
            curves={data.psdCurves}
            samples={selectedSamples}
          />
          <GroupedMetricChart
            title="PSD D10 / D50 / D90"
            subtitle="Grouped D-value comparison when full PSD curves are not the primary view."
            samples={selectedSamples}
            data={data}
            metricKeys={["d10", "d50", "d90"]}
            yAxisLabel="Particle size (um)"
          />
          <GroupedMetricChart
            title="PSD Span"
            subtitle="Calculated span = (D90 - D10) / D50."
            samples={selectedSamples}
            data={data}
            metricKeys={["span"]}
            yAxisLabel="Span (-)"
          />
          <GroupedMetricChart
            title="KF Moisture"
            subtitle="Mean moisture with repeat count retained in the source passport."
            samples={selectedSamples}
            data={data}
            metricKeys={["moisture"]}
            yAxisLabel="Moisture (ppm)"
          />
          <GroupedMetricChart
            title="Bulk vs Tapped Density"
            subtitle="Density comparison across selected powder states."
            samples={selectedSamples}
            data={data}
            metricKeys={["bulkDensity", "tappedDensity"]}
            yAxisLabel="Density (g cm-3)"
          />
          <GroupedMetricChart
            title="Hausner Ratio and Carr Index"
            subtitle="Flowability indicators calculated per repeat before averaging."
            samples={selectedSamples}
            data={data}
            metricKeys={["hausnerRatio", "carrIndex"]}
            yAxisLabel="Index / percent"
          />
          <HausnerMoistureChart data={data} samples={selectedSamples} />
          <RelationshipScatterChart
            title="D50 vs Hausner Ratio"
            subtitle="Checks whether coarser or finer powder states align with flowability changes."
            rows={d50HausnerRows}
            xAxisLabel="D50 (um)"
            yAxisLabel="Hausner Ratio (-)"
            yThresholds={[1.1, 1.2, 1.25]}
          />
          <RelationshipScatterChart
            title="PSD Span vs Carr Index"
            subtitle="Compares distribution breadth against compressibility."
            rows={spanCarrRows}
            xAxisLabel="PSD Span (-)"
            yAxisLabel="Carr Index (%)"
          />
          <DensityEvolutionChart
            title="GranuTap / GranuPack Curve Overlay"
            subtitle="Density evolution with dashed initial and final density references."
            curves={selectedTapCurves}
            samples={selectedSamples}
          />
          <AvalancheBoxPlot
            title="GranuDrum First Avalanche"
            subtitle="Avalanche angle spread by selected powder state."
            series={data.granudrumSeries}
            samples={selectedSamples}
          />
          <ScientificLineChart
            title="GranuDrum Speed Hysteresis"
            subtitle="Dynamic angle vs speed for selected samples where speed data exists."
            series={speedSeries}
            xKey="speed_rpm"
            yKey="dynamic_angle_deg"
            xAxisLabel="Speed (rpm)"
            yAxisLabel="Dynamic angle (deg)"
          />
          <EmptyChartState
            title="Circularity vs FT4 BFE"
            message="Ready for ASEM morphology and FT4 summary uploads."
          />
          <EmptyChartState
            title="Oxygen-rich Fraction vs Cohesion"
            message="Ready for AZtecFeature chemistry and GranuDrum cohesion comparisons."
          />
        </div>
      </section>

      <section className="comparison-table-wrap">
        <h2>Metric Matrix</h2>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Metric</th>
              {selectedSamples.map((sample) => (
                <th key={sample.sample_id}>{sample.display_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparedRows.map((row) => (
              <tr key={row.metricKey}>
                <th>{metricDefinitions[row.metricKey].label}</th>
                {row.values.map(({ sample, stat }) => (
                  <td key={`${row.metricKey}-${sample.sample_id}`}>{formatStatLine(stat)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th>SEM image count</th>
              {selectedSamples.map((sample) => (
                <td key={`sem-${sample.sample_id}`}>
                  {getSampleKeyMetrics(sample, data.measurements, data.images, data.granudrumSeries).semImageCount}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="comparison-bars">
        <h2>Quick Scan</h2>
        {comparedRows.map((row) => (
          <BarGroup
            key={row.metricKey}
            metricKey={row.metricKey}
            values={row.values}
          />
        ))}
      </section>
    </div>
  );
}

function CompareCard({ sample, data }: { sample: Sample; data: AtlasData }) {
  const metrics = getSampleKeyMetrics(sample, data.measurements, data.images, data.granudrumSeries);

  return (
    <article className="compare-card">
      <div className="sample-card-top">
        <div>
          <p className="eyebrow">{sample.alloy}</p>
          <h3>{sample.display_name}</h3>
        </div>
        <Link className="text-button" to={`/samples/${sample.sample_id}`}>Passport</Link>
      </div>
      <p className="sample-meta">{sample.supplier} / {sample.batch}</p>
      <TagList tags={sample.tags.slice(0, 3)} />
      <MethodBadges methods={metrics.availableMethods} />
      <div className="metric-grid single-column">
        <StatTile stat={metrics.d50} compact />
        <StatTile stat={metrics.moisture} compact />
        <StatTile stat={metrics.hausnerRatio} compact />
        <div className="metric-tile compact">
          <span className="metric-label">SEM images</span>
          <strong>{metrics.semImageCount}</strong>
          <span className="metric-meta">records</span>
        </div>
      </div>
    </article>
  );
}

function BarGroup({
  metricKey,
  values,
}: {
  metricKey: MetricKey;
  values: { sample: Sample; stat: MetricStat }[];
}) {
  const max = Math.max(...values.map(({ stat }) => stat.mean ?? 0), 0);

  return (
    <div className="bar-group">
      <div className="bar-heading">
        <strong>{metricDefinitions[metricKey].label}</strong>
        <span>{metricDefinitions[metricKey].unit}</span>
      </div>
      <div className="bars">
        {values.map(({ sample, stat }) => {
          const width = max > 0 && stat.mean != null ? `${Math.max((stat.mean / max) * 100, 3)}%` : "0%";
          return (
            <div key={`${metricKey}-${sample.sample_id}`} className="bar-row">
              <span>{sample.display_name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width }} />
              </div>
              <strong>{formatMetricValue(stat)}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toggleSample(
  sampleId: string,
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
) {
  setSelectedIds((current) => {
    if (current.includes(sampleId)) {
      return current.filter((id) => id !== sampleId);
    }

    return [...current, sampleId];
  });
}
