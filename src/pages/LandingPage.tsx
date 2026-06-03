import { Link } from "react-router-dom";
import {
  MiniMetric,
  PageHeader,
  SampleCard,
} from "../components/Common";
import {
  assetUrl,
  getSampleKeyMetrics,
  getSummaryCounts,
} from "../lib/data";
import type { AtlasData } from "../lib/types";

export default function LandingPage({ data }: { data: AtlasData }) {
  const counts = getSummaryCounts(data);
  const featuredSamples = data.samples.filter((sample) => sample.featured).slice(0, 4);

  return (
    <div className="landing-page">
      <section
        className="hero"
        style={{
          backgroundImage: `url(${assetUrl("images/sem/atlas-hero.png")})`,
        }}
      >
        <div className="hero-content">
          <p className="eyebrow">Mostly Nominal Labs</p>
          <h1>Drift Atlas</h1>
          <p className="hero-subtitle">Powder Characterisation Atlas</p>
          <p className="hero-line">Understand how powders drift from particle to process.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/samples">Explore Samples</Link>
            <Link className="button secondary" to="/compare">Compare Powders</Link>
          </div>
        </div>
      </section>

      <section className="summary-grid" aria-label="Atlas summary">
        <MiniMetric label="Samples" value={String(counts.sampleCount)} />
        <MiniMetric label="Alloys" value={String(counts.alloyCount)} />
        <MiniMetric label="Methods" value={String(counts.methodCount)} />
        <MiniMetric label="Measurements" value={String(counts.measurementCount)} />
      </section>

      <PageHeader
        eyebrow="Featured powder passports"
        title="Sample-first, from identity to behaviour"
        subtitle="Every card opens a complete powder passport with identity, storage history, repeat statistics, SEM context, and comparison-ready metrics."
      />

      <section className="featured-grid">
        {featuredSamples.map((sample) => (
          <SampleCard
            key={sample.sample_id}
            sample={sample}
            measurements={data.measurements}
            images={data.images}
          />
        ))}
      </section>

      <section className="value-strip">
        {data.samples.slice(0, 3).map((sample) => {
          const metrics = getSampleKeyMetrics(sample, data.measurements, data.images);
          return (
            <div key={sample.sample_id} className="value-item">
              <span>{sample.display_name}</span>
              <strong>{sample.alloy}</strong>
              <small>
                D50 {metrics.d50.mean?.toFixed(1) ?? "NA"} um / KF {metrics.moisture.mean?.toFixed(0) ?? "NA"} ppm
              </small>
            </div>
          );
        })}
      </section>
    </div>
  );
}
