import { useMemo, useState } from "react";
import {
  PageHeader,
  SampleCard,
} from "../components/Common";
import { getAvailableMethods } from "../lib/data";
import type { AtlasData } from "../lib/types";

interface Filters {
  alloy: string;
  supplier: string;
  powderState: string;
  method: string;
  tag: string;
}

const emptyFilters: Filters = {
  alloy: "all",
  supplier: "all",
  powderState: "all",
  method: "all",
  tag: "all",
};

export default function SampleAtlasPage({ data }: { data: AtlasData }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const options = useMemo(() => {
    return {
      alloys: unique(data.samples.map((sample) => sample.alloy)),
      suppliers: unique(data.samples.map((sample) => sample.supplier)),
      powderStates: unique(data.samples.map((sample) => sample.powder_state)),
      methods: unique(data.samples.flatMap((sample) => {
        return getAvailableMethods(sample.sample_id, data.measurements, data.images, data.granudrumSeries);
      })),
      tags: unique(data.samples.flatMap((sample) => sample.tags)),
    };
  }, [data]);

  const filteredSamples = data.samples.filter((sample) => {
    const methods = getAvailableMethods(sample.sample_id, data.measurements, data.images, data.granudrumSeries);
    return matches(filters.alloy, sample.alloy)
      && matches(filters.supplier, sample.supplier)
      && matches(filters.powderState, sample.powder_state)
      && (filters.method === "all" || methods.includes(filters.method))
      && (filters.tag === "all" || sample.tags.includes(filters.tag));
  });

  return (
    <div>
      <PageHeader
        eyebrow="Sample Atlas"
        title="Browse powder samples"
        subtitle="Start from a sample, then drill into its full powder passport."
      />

      <section className="filter-bar" aria-label="Sample filters">
        <SelectFilter
          label="Alloy"
          value={filters.alloy}
          values={options.alloys}
          onChange={(alloy) => setFilters((current) => ({ ...current, alloy }))}
        />
        <SelectFilter
          label="Supplier"
          value={filters.supplier}
          values={options.suppliers}
          onChange={(supplier) => setFilters((current) => ({ ...current, supplier }))}
        />
        <SelectFilter
          label="Powder state"
          value={filters.powderState}
          values={options.powderStates}
          onChange={(powderState) => setFilters((current) => ({ ...current, powderState }))}
        />
        <SelectFilter
          label="Method"
          value={filters.method}
          values={options.methods}
          onChange={(method) => setFilters((current) => ({ ...current, method }))}
        />
        <SelectFilter
          label="Tag"
          value={filters.tag}
          values={options.tags}
          onChange={(tag) => setFilters((current) => ({ ...current, tag }))}
        />
        <button className="text-button" type="button" onClick={() => setFilters(emptyFilters)}>
          Reset
        </button>
      </section>

      <div className="result-line">
        <strong>{filteredSamples.length}</strong> of {data.samples.length} samples
      </div>

      <section className="sample-grid">
        {filteredSamples.map((sample) => (
          <SampleCard
            key={sample.sample_id}
            sample={sample}
            measurements={data.measurements}
            images={data.images}
            granudrumSeries={data.granudrumSeries}
          />
        ))}
      </section>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">All</option>
        {values.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function matches(filterValue: string, sampleValue: string): boolean {
  return filterValue === "all" || filterValue === sampleValue;
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
