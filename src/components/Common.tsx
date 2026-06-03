import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  formatMetricValue,
  formatNumber,
  formatStatLine,
  getRawRowsForMetric,
  getSampleKeyMetrics,
  metricDefinitions,
} from "../lib/data";
import type {
  AtlasImage,
  Measurement,
  MetricKey,
  MetricStat,
  Sample,
} from "../lib/types";

export function LoadingScreen() {
  return (
    <div className="state-panel">
      <p className="eyebrow">Loading atlas</p>
      <h2>Preparing powder passports...</h2>
    </div>
  );
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="state-panel error-panel">
      <p className="eyebrow">Data error</p>
      <h2>The atlas data could not be loaded.</h2>
      <p>{message}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="lede">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <span key={tag} className="tag">{tag}</span>
      ))}
    </div>
  );
}

export function MethodBadges({ methods }: { methods: string[] }) {
  return (
    <div className="method-badges">
      {methods.map((method) => (
        <span key={method}>{method}</span>
      ))}
    </div>
  );
}

export function StatTile({ stat, compact = false }: { stat: MetricStat; compact?: boolean }) {
  const hasSpread = stat.n > 1 && stat.sd != null;

  return (
    <div className={compact ? "metric-tile compact" : "metric-tile"}>
      <span className="metric-label">{stat.label}</span>
      <strong>{formatMetricValue(stat)}</strong>
      <span className="metric-meta">
        n={stat.n}
        {hasSpread ? `, SD ${formatNumber(stat.sd, metricDefinitions[stat.key].precision)}` : ""}
      </span>
    </div>
  );
}

export function SampleCard({
  sample,
  measurements,
  images,
}: {
  sample: Sample;
  measurements: Measurement[];
  images: AtlasImage[];
}) {
  const metrics = getSampleKeyMetrics(sample, measurements, images);

  return (
    <Link className="sample-card" to={`/samples/${sample.sample_id}`}>
      <div className="sample-card-top">
        <div>
          <p className="eyebrow">{sample.alloy}</p>
          <h3>{sample.display_name}</h3>
        </div>
        <span className="state-chip">{sample.powder_state}</span>
      </div>
      <p className="sample-meta">{sample.supplier} / {sample.batch}</p>
      <div className="mini-metrics">
        <MiniMetric label="D50" value={formatMetricValue(metrics.d50)} />
        <MiniMetric label="Moisture" value={formatMetricValue(metrics.moisture)} />
        <MiniMetric label="Hausner" value={formatMetricValue(metrics.hausnerRatio)} />
        <MiniMetric label="SEM" value={`${metrics.semImageCount} images`} />
      </div>
      <TagList tags={sample.tags.slice(0, 3)} />
    </Link>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

export function MetricRow({
  sampleId,
  metric,
  measurements,
}: {
  sampleId: string;
  metric: MetricStat;
  measurements: Measurement[];
}) {
  const rawRows = getRawRowsForMetric(sampleId, metric.key, measurements);

  return (
    <details className="repeat-details">
      <summary>
        <span>{metric.label}</span>
        <strong>{formatStatLine(metric)}</strong>
      </summary>
      {rawRows.length ? (
        <table>
          <thead>
            <tr>
              <th>Repeat</th>
              <th>Value</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rawRows.map((row) => (
              <tr key={`${metric.key}-${row.repeat}`}>
                <td>{row.repeat}</td>
                <td>
                  {formatNumber(row.value, metricDefinitions[metric.key].precision)}
                  {row.unit ? ` ${row.unit}` : ""}
                </td>
                <td>{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">No repeat-level observations recorded yet.</p>
      )}
    </details>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="passport-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function metricStatForKey(
  metrics: Record<MetricKey, MetricStat>,
  key: MetricKey,
): MetricStat {
  return metrics[key];
}
