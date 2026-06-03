import { PageHeader } from "../components/Common";
import type { AtlasData } from "../lib/types";

export default function MethodsPage({ data }: { data: AtlasData }) {
  const currentMethods = data.methods.filter((method) => method.future_status === "MVP");
  const futureMethods = data.methods.filter((method) => method.future_status === "Future");

  return (
    <div>
      <PageHeader
        eyebrow="Methods / Knowledge Base"
        title="Characterisation methods"
        subtitle="Method notes explain what each observation means inside a powder passport."
      />

      <section className="method-card-grid">
        {currentMethods.map((method) => (
          <MethodCard key={method.method_id} method={method} />
        ))}
      </section>

      <h2 className="section-heading">Future Modules</h2>
      <section className="method-card-grid">
        {futureMethods.map((method) => (
          <MethodCard key={method.method_id} method={method} />
        ))}
      </section>
    </div>
  );
}

function MethodCard({ method }: { method: AtlasData["methods"][number] }) {
  return (
    <article className="method-card">
      <div className="method-card-head">
        <div>
          <p className="eyebrow">{method.method_id}</p>
          <h3>{method.name}</h3>
        </div>
        <span className={method.future_status === "MVP" ? "status current" : "status future"}>
          {method.future_status}
        </span>
      </div>
      <p>{method.purpose}</p>
      <dl className="method-meta">
        <div>
          <dt>Version</dt>
          <dd>{method.version}</dd>
        </div>
      </dl>
      <h4>Key Parameters</h4>
      <ul>
        {method.key_parameters.map((parameter) => (
          <li key={parameter}>{parameter}</li>
        ))}
      </ul>
      <h4>Interpretation Notes</h4>
      <ul>
        {method.interpretation_notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </article>
  );
}
