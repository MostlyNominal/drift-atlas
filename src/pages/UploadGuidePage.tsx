import { PageHeader, Section } from "../components/Common";

const sampleFields = [
  "sample_id",
  "display_name",
  "alloy",
  "supplier",
  "batch",
  "lot_number",
  "powder_state",
  "psd_class",
  "storage_condition",
  "conditioning",
  "tags",
  "notes",
];

const measurementFields = [
  "measurement_id",
  "sample_id",
  "method",
  "metric",
  "value",
  "unit",
  "repeat",
  "date",
  "method_version",
  "instrument",
  "notes",
];

export default function UploadGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Data Upload Guide"
        title="Static contributor workflow"
        subtitle="Viewers use the website. Contributors update JSON or template files, commit to GitHub, and GitHub Pages redeploys the atlas."
      />

      <Section title="Contributor Flow">
        <ol className="workflow-list">
          <li>Edit the static JSON files or prepare template data for a sample.</li>
          <li>Commit the data and code changes to GitHub.</li>
          <li>GitHub Pages rebuilds and serves the new browser-only atlas.</li>
        </ol>
      </Section>

      <Section title="Processed Data Files">
        <div className="file-grid">
          <FileCard name="samples.json" fields={sampleFields} />
          <FileCard name="measurements.json" fields={measurementFields} />
          <FileCard
            name="images.json"
            fields={[
              "image_id",
              "sample_id",
              "image_path",
              "thumbnail_path",
              "type",
              "magnification",
              "detector",
              "accelerating_voltage_kV",
              "working_distance_mm",
              "notes",
            ]}
          />
          <FileCard
            name="methods.json"
            fields={[
              "method_id",
              "name",
              "purpose",
              "version",
              "key_parameters",
              "interpretation_notes",
              "future_status",
            ]}
          />
        </div>
      </Section>

      <Section title="Repeat Logic">
        <div className="guide-callout">
          <p>Store repeats as individual observations. The browser accepts n = 1, 2, 3 or more, calculates mean, SD and n, and always displays n.</p>
          <p>Error bars are only appropriate when n is greater than 1. Raw repeat values remain visible in expandable tables inside each powder passport.</p>
        </div>
      </Section>

      <Section title="Static-first Design">
        <p className="notes">
          Drift Atlas is a normal GitHub Pages website. There is no backend, Streamlit app, local database,
          DuckDB-WASM bundle, or installation step for viewers.
        </p>
      </Section>
    </div>
  );
}

function FileCard({ name, fields }: { name: string; fields: string[] }) {
  return (
    <article className="file-card">
      <h3>{name}</h3>
      <div className="field-list">
        {fields.map((field) => (
          <code key={field}>{field}</code>
        ))}
      </div>
    </article>
  );
}
