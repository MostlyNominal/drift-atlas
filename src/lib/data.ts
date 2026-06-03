import { calculateMeanSDN } from "./stats";
import type {
  AtlasData,
  AtlasImage,
  Measurement,
  MethodDefinition,
  MetricDefinition,
  MetricKey,
  MetricStat,
  Sample,
  SampleKeyMetrics,
  SummaryCounts,
} from "./types";

const DATA_ROOT = `${import.meta.env.BASE_URL}data/processed`;

const cache = new Map<string, unknown>();

export const metricDefinitions: Record<MetricKey, MetricDefinition> = {
  d10: {
    key: "d10",
    label: "D10",
    method: "PSD",
    sourceMetric: "D10",
    unit: "um",
    precision: 1,
  },
  d50: {
    key: "d50",
    label: "D50",
    method: "PSD",
    sourceMetric: "D50",
    unit: "um",
    precision: 1,
  },
  d90: {
    key: "d90",
    label: "D90",
    method: "PSD",
    sourceMetric: "D90",
    unit: "um",
    precision: 1,
  },
  span: {
    key: "span",
    label: "Span",
    method: "PSD",
    sourceMetric: null,
    unit: "",
    precision: 2,
  },
  moisture: {
    key: "moisture",
    label: "KF moisture",
    method: "KF",
    sourceMetric: "moisture_ppm",
    unit: "ppm",
    precision: 0,
  },
  bulkDensity: {
    key: "bulkDensity",
    label: "Bulk density",
    method: "GranuTap",
    sourceMetric: "bulk_density",
    unit: "g/cm3",
    precision: 3,
  },
  tappedDensity: {
    key: "tappedDensity",
    label: "Tapped density",
    method: "GranuTap",
    sourceMetric: "tapped_density",
    unit: "g/cm3",
    precision: 3,
  },
  hausnerRatio: {
    key: "hausnerRatio",
    label: "Hausner ratio",
    method: "GranuTap",
    sourceMetric: null,
    unit: "",
    precision: 3,
  },
  carrIndex: {
    key: "carrIndex",
    label: "Carr index",
    method: "GranuTap",
    sourceMetric: null,
    unit: "%",
    precision: 1,
  },
};

const compareMetricOrder: MetricKey[] = [
  "d10",
  "d50",
  "d90",
  "moisture",
  "bulkDensity",
  "tappedDensity",
  "hausnerRatio",
  "carrIndex",
];

export const atlasMetricOrder: MetricKey[] = [
  "d10",
  "d50",
  "d90",
  "span",
  "moisture",
  "bulkDensity",
  "tappedDensity",
  "hausnerRatio",
  "carrIndex",
];

export function getCompareMetricOrder(): MetricKey[] {
  return compareMetricOrder;
}

async function getJSON<T>(fileName: string): Promise<T> {
  if (cache.has(fileName)) {
    return cache.get(fileName) as T;
  }

  const response = await fetch(`${DATA_ROOT}/${fileName}`);
  if (!response.ok) {
    throw new Error(`Could not load ${fileName} (${response.status})`);
  }

  const data = (await response.json()) as T;
  cache.set(fileName, data);
  return data;
}

export async function loadAtlasData(): Promise<AtlasData> {
  const [samples, measurements, images, methods] = await Promise.all([
    getJSON<Sample[]>("samples.json"),
    getJSON<Measurement[]>("measurements.json"),
    getJSON<AtlasImage[]>("images.json"),
    getJSON<MethodDefinition[]>("methods.json"),
  ]);

  return { samples, measurements, images, methods };
}

export function assetUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${cleanPath}`;
}

export function groupMeasurementsBySample(measurements: Measurement[]): Map<string, Measurement[]> {
  const groups = new Map<string, Measurement[]>();

  for (const measurement of measurements) {
    const rows = groups.get(measurement.sample_id) ?? [];
    rows.push(measurement);
    groups.set(measurement.sample_id, rows);
  }

  return groups;
}

export function getAvailableMethods(
  sampleId: string,
  measurements: Measurement[],
  images: AtlasImage[],
): string[] {
  const methods = new Set(
    measurements
      .filter((measurement) => measurement.sample_id === sampleId)
      .map((measurement) => measurement.method),
  );

  if (images.some((image) => image.sample_id === sampleId)) {
    methods.add("SEM");
  }

  return [...methods].sort((a, b) => a.localeCompare(b));
}

export function getSampleImages(sampleId: string, images: AtlasImage[]): AtlasImage[] {
  return images.filter((image) => image.sample_id === sampleId);
}

export function getMetricStats(
  sampleId: string,
  metricKey: MetricKey,
  measurements: Measurement[],
): MetricStat {
  const definition = metricDefinitions[metricKey];
  const values = getMetricValues(sampleId, metricKey, measurements);
  return {
    ...calculateMeanSDN(values),
    key: metricKey,
    label: definition.label,
    unit: definition.unit,
    values,
  };
}

export function getSampleKeyMetrics(
  sample: Sample,
  measurements: Measurement[],
  images: AtlasImage[],
): SampleKeyMetrics {
  return {
    d10: getMetricStats(sample.sample_id, "d10", measurements),
    d50: getMetricStats(sample.sample_id, "d50", measurements),
    d90: getMetricStats(sample.sample_id, "d90", measurements),
    span: getMetricStats(sample.sample_id, "span", measurements),
    moisture: getMetricStats(sample.sample_id, "moisture", measurements),
    bulkDensity: getMetricStats(sample.sample_id, "bulkDensity", measurements),
    tappedDensity: getMetricStats(sample.sample_id, "tappedDensity", measurements),
    hausnerRatio: getMetricStats(sample.sample_id, "hausnerRatio", measurements),
    carrIndex: getMetricStats(sample.sample_id, "carrIndex", measurements),
    semImageCount: getSampleImages(sample.sample_id, images).length,
    availableMethods: getAvailableMethods(sample.sample_id, measurements, images),
  };
}

export function getSummaryCounts(data: AtlasData): SummaryCounts {
  return {
    sampleCount: data.samples.length,
    alloyCount: new Set(data.samples.map((sample) => sample.alloy)).size,
    methodCount: data.methods.length,
    measurementCount: data.measurements.length,
  };
}

export function getSampleMeasurements(
  sampleId: string,
  measurements: Measurement[],
  method?: string,
): Measurement[] {
  return measurements
    .filter((measurement) => {
      return measurement.sample_id === sampleId && (!method || measurement.method === method);
    })
    .sort((a, b) => {
      return a.method.localeCompare(b.method)
        || a.metric.localeCompare(b.metric)
        || a.repeat - b.repeat;
    });
}

export function getRawRowsForMetric(
  sampleId: string,
  metricKey: MetricKey,
  measurements: Measurement[],
): { repeat: number; value: number; unit: string; source: string }[] {
  const definition = metricDefinitions[metricKey];
  const derived = getDerivedRows(sampleId, metricKey, measurements);

  if (derived.length) {
    return derived.map((row) => ({
      repeat: row.repeat,
      value: row.value,
      unit: definition.unit,
      source: row.source,
    }));
  }

  if (!definition.sourceMetric) return [];

  return measurements
    .filter((measurement) => {
      return measurement.sample_id === sampleId
        && measurement.method === definition.method
        && measurement.metric === definition.sourceMetric;
    })
    .sort((a, b) => a.repeat - b.repeat)
    .map((measurement) => ({
      repeat: measurement.repeat,
      value: measurement.value,
      unit: measurement.unit,
      source: measurement.instrument,
    }));
}

export function formatNumber(value: number | null, precision: number): string {
  if (value == null || !Number.isFinite(value)) return "No data";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  });
}

export function formatMetricValue(stat: MetricStat): string {
  if (stat.mean == null) return "No data";
  const precision = metricDefinitions[stat.key].precision;
  const value = formatNumber(stat.mean, precision);
  return stat.unit ? `${value} ${stat.unit}` : value;
}

export function formatStatLine(stat: MetricStat): string {
  if (stat.mean == null) return "No data";

  const precision = metricDefinitions[stat.key].precision;
  const mean = formatNumber(stat.mean, precision);
  const unit = stat.unit ? ` ${stat.unit}` : "";

  if (stat.n > 1 && stat.sd != null) {
    return `${mean} +/- ${formatNumber(stat.sd, precision)}${unit} (n=${stat.n})`;
  }

  return `${mean}${unit} (n=${stat.n})`;
}

function getMetricValues(
  sampleId: string,
  metricKey: MetricKey,
  measurements: Measurement[],
): number[] {
  const derived = getDerivedRows(sampleId, metricKey, measurements);

  if (derived.length) {
    return derived.map((row) => row.value);
  }

  const definition = metricDefinitions[metricKey];
  if (!definition.sourceMetric) return [];

  return measurements
    .filter((measurement) => {
      return measurement.sample_id === sampleId
        && measurement.method === definition.method
        && measurement.metric === definition.sourceMetric;
    })
    .sort((a, b) => a.repeat - b.repeat)
    .map((measurement) => measurement.value);
}

function getDerivedRows(
  sampleId: string,
  metricKey: MetricKey,
  measurements: Measurement[],
): { repeat: number; value: number; source: string }[] {
  if (metricKey === "hausnerRatio" || metricKey === "carrIndex") {
    const rows = pairByRepeat(sampleId, measurements, "bulk_density", "tapped_density");
    return rows.map((row) => {
      const hausnerRatio = row.b / row.a;
      return {
        repeat: row.repeat,
        value: metricKey === "hausnerRatio"
          ? hausnerRatio
          : ((row.b - row.a) / row.b) * 100,
        source: "Calculated from GranuTap repeat",
      };
    });
  }

  if (metricKey === "span") {
    const rows = groupPsdByRepeat(sampleId, measurements);
    return rows.map((row) => ({
      repeat: row.repeat,
      value: (row.d90 - row.d10) / row.d50,
      source: "Calculated from PSD repeat",
    }));
  }

  return [];
}

function pairByRepeat(
  sampleId: string,
  measurements: Measurement[],
  firstMetric: string,
  secondMetric: string,
): { repeat: number; a: number; b: number }[] {
  const byRepeat = new Map<number, Partial<{ a: number; b: number }>>();

  for (const measurement of measurements) {
    if (measurement.sample_id !== sampleId || measurement.method !== "GranuTap") continue;

    const current = byRepeat.get(measurement.repeat) ?? {};
    if (measurement.metric === firstMetric) current.a = measurement.value;
    if (measurement.metric === secondMetric) current.b = measurement.value;
    byRepeat.set(measurement.repeat, current);
  }

  return [...byRepeat.entries()]
    .filter((entry): entry is [number, { a: number; b: number }] => {
      return typeof entry[1].a === "number" && typeof entry[1].b === "number";
    })
    .map(([repeat, values]) => ({ repeat, a: values.a, b: values.b }))
    .sort((a, b) => a.repeat - b.repeat);
}

function groupPsdByRepeat(
  sampleId: string,
  measurements: Measurement[],
): { repeat: number; d10: number; d50: number; d90: number }[] {
  const byRepeat = new Map<number, Partial<{ d10: number; d50: number; d90: number }>>();

  for (const measurement of measurements) {
    if (measurement.sample_id !== sampleId || measurement.method !== "PSD") continue;

    const current = byRepeat.get(measurement.repeat) ?? {};
    if (measurement.metric === "D10") current.d10 = measurement.value;
    if (measurement.metric === "D50") current.d50 = measurement.value;
    if (measurement.metric === "D90") current.d90 = measurement.value;
    byRepeat.set(measurement.repeat, current);
  }

  return [...byRepeat.entries()]
    .filter((entry): entry is [number, { d10: number; d50: number; d90: number }] => {
      return typeof entry[1].d10 === "number"
        && typeof entry[1].d50 === "number"
        && typeof entry[1].d90 === "number";
    })
    .map(([repeat, values]) => ({ repeat, ...values }))
    .sort((a, b) => a.repeat - b.repeat);
}
