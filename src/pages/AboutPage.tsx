import { PageHeader, Section } from "../components/Common";

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        eyebrow="About Drift Atlas"
        title="A powder passport and comparison atlas"
        subtitle="Drift Atlas is built for metallic powder characterisation where the sample, not the test method, is the centre of the system."
      />

      <Section title="Project Vision">
        <p className="notes">
          The atlas connects sample identity, alloy, supplier, batch, storage history, PSD, moisture,
          tap density, SEM context, and future rheology or chemistry modules into one readable powder passport.
        </p>
      </Section>

      <Section title="Mostly Nominal Labs">
        <p className="notes">
          Mostly Nominal Labs is the quiet lab notebook behind the site: practical, static-first,
          and designed to be credible in front of research partners while staying simple enough to maintain.
        </p>
      </Section>

      <Section title="Why Sample-first">
        <p className="notes">
          A PSD result, KF result, SEM image, or GranuTap repeat only becomes useful when it belongs to a
          powder state with a history. Drift Atlas keeps that context attached, then lets samples be compared.
        </p>
      </Section>

      <Section title="Roadmap">
        <div className="roadmap">
          <RoadmapItem label="MVP" text="Sample atlas, powder passports, comparison, PSD, KF, GranuTap, SEM metadata." />
          <RoadmapItem label="GranuDrum" text="Speed-level traces, First Avalanches, Speed Hysteresis, Reverse and Sequence modes." />
          <RoadmapItem label="ASEM" text="AZtecFeature particle morphology, chemistry wt%, and ECD comparison to PSD." />
          <RoadmapItem label="FT4 / XRD / DSC-TGA" text="Static summaries and comments first, richer curve views later." />
          <RoadmapItem label="Correlations" text="Cross-method trends once the sample count justifies them." />
          <RoadmapItem label="Prediction" text="Flowability and processing predictions only after the atlas has enough evidence." />
        </div>
      </Section>
    </div>
  );
}

function RoadmapItem({ label, text }: { label: string; text: string }) {
  return (
    <article className="roadmap-item">
      <strong>{label}</strong>
      <p>{text}</p>
    </article>
  );
}
