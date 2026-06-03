import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  EmptyState,
  MethodBadges,
  MetricRow,
  PageHeader,
  Section,
  StatTile,
  TagList,
} from "../components/Common";
import {
  assetUrl,
  getAvailableMethods,
  getSampleGranuDrumSeries,
  getSampleImages,
  getSampleKeyMetrics,
  getSamplePSDCurves,
  getTapCurveSeries,
} from "../lib/data";
import AvalancheBoxPlot from "../components/charts/AvalancheBoxPlot";
import DensityEvolutionChart from "../components/charts/DensityEvolutionChart";
import GroupedMetricChart from "../components/charts/GroupedMetricChart";
import MetricErrorBarChart from "../components/charts/MetricErrorBarChart";
import PSDCurveChart from "../components/charts/PSDCurveChart";
import ScientificLineChart from "../components/charts/ScientificLineChart";
import type { AtlasData, MetricKey, MetricStat, SampleKeyMetrics } from "../lib/types";

export default function SampleDetailPage({ data }: { data: AtlasData }) {
  const { sampleId } = useParams();
  const sample = data.samples.find((candidate) => candidate.sample_id === sampleId);

  if (!sample) {
    return (
      <div>
        <PageHeader
          eyebrow="Powder Passport"
          title="Sample not found"
          subtitle="This passport does not exist in the current static dataset."
          actions={<Link className="button secondary" to="/samples">Back to Sample Atlas</Link>}
        />
      </div>
    );
  }

  const metrics = getSampleKeyMetrics(sample, data.measurements, data.images, data.granudrumSeries);
  const sampleImages = getSampleImages(sample.sample_id, data.images);
  const methods = getAvailableMethods(sample.sample_id, data.measurements, data.images, data.granudrumSeries);
  const psdCurves = getSamplePSDCurves(sample.sample_id, data.psdCurves);
  const tapCurves = getTapCurveSeries([sample.sample_id], data.granutapCurves);
  const avalancheSeries = getSampleGranuDrumSeries(sample.sample_id, data.granudrumSeries, "first_avalanche");
  const speedSeries = getSampleGranuDrumSeries(sample.sample_id, data.granudrumSeries, "speed_hysteresis")
    .map((series) => ({
      name: `${sample.display_name} repeat ${series.repeat}`,
      points: series.points ?? [],
    }));

  return (
    <article className="passport">
      <PageHeader
        eyebrow="Powder Passport"
        title={sample.display_name}
        subtitle={`${sample.alloy} / ${sample.supplier} / ${sample.batch}`}
        actions={<Link className="button primary" to={`/compare?sample=${sample.sample_id}`}>Compare this sample</Link>}
      />

      <div className="passport-identity">
        <div>
          <TagList tags={sample.tags} />
          <MethodBadges methods={methods} />
        </div>
        <dl>
          <div>
            <dt>Sample ID</dt>
            <dd>{sample.sample_id}</dd>
          </div>
          <div>
            <dt>Lot number</dt>
            <dd>{sample.lot_number}</dd>
          </div>
          <div>
            <dt>Powder state</dt>
            <dd>{sample.powder_state}</dd>
          </div>
          <div>
            <dt>PSD class</dt>
            <dd>{sample.psd_class}</dd>
          </div>
        </dl>
      </div>

      <Section title="Overview">
        <div className="metric-grid">
          <StatTile stat={metrics.d50} />
          <StatTile stat={metrics.moisture} />
          <StatTile stat={metrics.hausnerRatio} />
          <div className="metric-tile">
            <span className="metric-label">SEM images</span>
            <strong>{metrics.semImageCount}</strong>
            <span className="metric-meta">metadata records</span>
          </div>
        </div>
      </Section>

      <Section title="Conditioning / Storage">
        <div className="info-grid">
          <InfoItem label="Storage condition" value={sample.storage_condition} />
          <InfoItem label="Conditioning" value={sample.conditioning} />
          <InfoItem label="Supplier" value={sample.supplier} />
          <InfoItem label="Batch" value={sample.batch} />
        </div>
      </Section>

      <Section title="Key Metrics">
        <div className="metric-grid dense">
          {(["d10", "d50", "d90", "span", "moisture", "bulkDensity", "tappedDensity", "hausnerRatio", "carrIndex"] as MetricKey[])
            .map((key) => (
              <StatTile key={key} stat={metricFromKey(metrics, key)} compact />
            ))}
        </div>
      </Section>

      <MethodSection
        title="PSD"
        metrics={[metrics.d10, metrics.d50, metrics.d90, metrics.span]}
        sampleId={sample.sample_id}
        measurements={data.measurements}
      >
        <div className="chart-grid">
          <PSDCurveChart
            title="PSD Curve"
            subtitle="Mean volume distribution from available repeat curves."
            curves={psdCurves}
            samples={[sample]}
          />
          <MetricErrorBarChart
            title="D-values and Span"
            subtitle="Repeat-level D10, D50, D90 and calculated span with mean +/- SD."
            metrics={[metrics.d10, metrics.d50, metrics.d90, metrics.span]}
            yAxisLabel="Particle size (um) / span"
          />
        </div>
      </MethodSection>

      <MethodSection
        title="KF Moisture"
        metrics={[metrics.moisture]}
        sampleId={sample.sample_id}
        measurements={data.measurements}
      >
        <MetricErrorBarChart
          title="KF Moisture Repeats"
          subtitle="Individual repeat points with mean +/- SD where n is greater than 1."
          metrics={[metrics.moisture]}
          yAxisLabel="Moisture (ppm)"
        />
      </MethodSection>

      <MethodSection
        title="GranuTap"
        metrics={[metrics.bulkDensity, metrics.tappedDensity, metrics.hausnerRatio, metrics.carrIndex]}
        sampleId={sample.sample_id}
        measurements={data.measurements}
      >
        <div className="chart-grid">
          {tapCurves.length ? (
            <DensityEvolutionChart
              title="Density Evolution"
              subtitle="Tap-level density curve with dashed initial and final density references."
              curves={tapCurves}
              samples={[sample]}
            />
          ) : (
            <GroupedMetricChart
              title="Bulk vs Tapped Density"
              subtitle="Fallback grouped density chart when tap-level curves are not available."
              samples={[sample]}
              data={data}
              metricKeys={["bulkDensity", "tappedDensity"]}
              yAxisLabel="Density (g cm-3)"
            />
          )}
          <MetricErrorBarChart
            title="Density and Flow Indices"
            subtitle="Bulk density, tapped density, Hausner ratio and Carr index by repeat."
            metrics={[metrics.bulkDensity, metrics.tappedDensity, metrics.hausnerRatio, metrics.carrIndex]}
            yAxisLabel="Density / index"
          />
        </div>
      </MethodSection>

      <Section title="GranuDrum">
        <div className="chart-grid">
          <AvalancheBoxPlot
            title="First Avalanche Angle"
            subtitle="Boxplot-style spread with median line and mean marker."
            series={avalancheSeries}
            samples={[sample]}
          />
          <ScientificLineChart
            title="Speed Hysteresis"
            subtitle="Dynamic angle vs speed for available up/down speed points."
            series={speedSeries}
            xKey="speed_rpm"
            yKey="dynamic_angle_deg"
            xAxisLabel="Speed (rpm)"
            yAxisLabel="Dynamic angle (deg)"
          />
        </div>
      </Section>

      <Section title="SEM Images">
        {sampleImages.length ? (
          <div className="sem-grid">
            {sampleImages.map((image) => (
              <figure key={image.image_id} className="sem-card">
                <img src={assetUrl(image.thumbnail_path)} alt={`${sample.display_name} ${image.type}`} />
                <figcaption>
                  <strong>{image.type}</strong>
                  <span>{image.magnification} / {image.detector}</span>
                  <span>{image.accelerating_voltage_kV} kV / WD {image.working_distance_mm} mm</span>
                  <small>{image.notes}</small>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState title="No SEM images">
            SEM image metadata can be added through images.json when micrographs are available.
          </EmptyState>
        )}
      </Section>

      <Section title="Future Modules">
        <div className="future-grid">
          {["FT4 powder rheology", "ASEM / AZtecFeature", "DSC / TGA", "XRD", "EBSD notes"].map((module) => (
            <EmptyState key={module} title={module}>
              Reserved for future static uploads and method documentation.
            </EmptyState>
          ))}
        </div>
      </Section>

      <Section title="Notes">
        <p className="notes">{sample.notes}</p>
      </Section>
    </article>
  );
}

function MethodSection({
  title,
  metrics,
  sampleId,
  measurements,
  children,
}: {
  title: string;
  metrics: MetricStat[];
  sampleId: string;
  measurements: AtlasData["measurements"];
  children?: ReactNode;
}) {
  return (
    <Section title={title}>
      {children}
      <div className="method-metrics">
        {metrics.map((metric) => (
          <MetricRow
            key={metric.key}
            sampleId={sampleId}
            metric={metric}
            measurements={measurements}
          />
        ))}
      </div>
    </Section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function metricFromKey(metrics: SampleKeyMetrics, key: MetricKey): MetricStat {
  return metrics[key];
}
