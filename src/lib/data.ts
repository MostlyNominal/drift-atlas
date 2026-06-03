import { calculateMeanSDN } from "./stats";
import type {
  AtlasData,
  AtlasImage,
  GranuDrumSeries,
  GranuTapCurve,
  HausnerQualityBand,
  Measurement,
  MethodDefinition,
  MetricDefinition,
  MetricKey,
  MetricStat,
  PSDCurve,
  RelationshipRow,
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

async function getOptionalJSON<T>(fileName: string, fallback: T): Promise<T> {
  try {
    return await getJSON<T>(fileName);
  } catch {
    cache.set(fileName, fallback);
    return fallback;
  }
}

export async function loadAtlasData(): Promise<AtlasData> {
  const [
    samples,
    measurements,
    images,
    methods,
    psdCurves,
    granutapCurves,
    granudrumSeries,
  ] = await Promise.all([
    getJSON<Sample[]>("samples.json"),
    getJSON<Measurement[]>("measurements.json"),
    getJSON<AtlasImage[]>("images.json"),
    getJSON<MethodDefinition[]>("methods.json"),
    getOptionalJSON<PSDCurve[]>("psd_curves.json", []),
    getOptionalJSON<GranuTapCurve[]>("granutap_curves.json", []),
    getOptionalJSON<GranuDrumSeries[]>("granudrum_series.json", []),
  ]);

  return { samples, measurements, images, methods, psdCurves, granutapCurves, granudrumSeries };
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
  granudrumSeries: GranuDrumSeries[] = [],
): string[] {
  const methods = new Set(
    measurements
      .filter((measurement) => measurement.sample_id === sampleId)
      .map((measurement) => measurement.method),
  );

  if (images.some((image) => image.sample_id === sampleId)) {
    methods.add("SEM");
  }

  if (granudrumSeries.some((series) => series.sample_id === sampleId)) {
    methods.add("GranuDrum");
  }

  return [...methods].sort((a, b) => a.localeCompare(b));
}

export function getSampleImages(sampleId: string, images: AtlasImage[]): AtlasImage[] {
  return images.filter((image) => image.sample_id === sampleId);
}

export function getMetricStats(sampleId: string, metricKey: MetricKey, measurements: Measurement[]): MetricStat;
export function getMetricStats(sampleId: string, method: string, metric: string, measurements: Measurement[]): MetricStat;
export function getMetricStats(
  sampleId: string,
  methodOrMetricKey: MetricKey | string,
  metricOrMeasurements: string | Measurement[],
  maybeMeasurements?: Measurement[],
): MetricStat {
  if (!Array.isArray(metricOrMeasurements)) {
    const metricKey = findMetricKey(methodOrMetricKey, metricOrMeasurements) ?? "moisture";
    const measurements = maybeMeasurements ?? [];
    const rows = getMetricRepeats(sampleId, methodOrMetricKey, metricOrMeasurements, measurements);
    const definition = metricDefinitions[metricKey];

    return {
      ...calculateMeanSDN(rows.map((row) => row.value)),
      key: metricKey,
      label: definition.label,
      unit: rows[0]?.unit ?? definition.unit,
      values: rows.map((row) => row.value),
    };
  }

  const metricKey = methodOrMetricKey as MetricKey;
  const measurements = metricOrMeasurements;
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

export function getMetricRepeats(
  sampleId: string,
  method: string,
  metric: string,
  measurements: Measurement[],
): { repeat: number; value: number; unit: string; date: string; instrument: string; notes: string }[] {
  return measurements
    .filter((measurement) => {
      return measurement.sample_id === sampleId
        && measurement.method === method
        && measurement.metric === metric;
    })
    .sort((a, b) => a.repeat - b.repeat)
    .map((measurement) => ({
      repeat: measurement.repeat,
      value: measurement.value,
      unit: measurement.unit,
      date: measurement.date,
      instrument: measurement.instrument,
      notes: measurement.notes,
    }));
}

export function getPSDStats(
  sampleId: string,
  measurements: Measurement[],
): Pick<SampleKeyMetrics, "d10" | "d50" | "d90" | "span"> {
  return {
    d10: getMetricStats(sampleId, "d10", measurements),
    d50: getMetricStats(sampleId, "d50", measurements),
    d90: getMetricStats(sampleId, "d90", measurements),
    span: getMetricStats(sampleId, "span", measurements),
  };
}

export function getPSDSpan(sampleId: string, measurements: Measurement[]): MetricStat {
  return getMetricStats(sampleId, "span", measurements);
}

export function getSamplePSDCurves(sampleId: string, curves: PSDCurve[]): PSDCurve[] {
  return curves
    .filter((curve) => curve.sample_id === sampleId)
    .sort((a, b) => a.repeat - b.repeat);
}

export function getTapCurveSeries(sampleIds: string[], curves: GranuTapCurve[]): GranuTapCurve[] {
  const ids = new Set(sampleIds);
  return curves
    .filter((curve) => ids.has(curve.sample_id))
    .sort((a, b) => a.sample_id.localeCompare(b.sample_id) || a.repeat - b.repeat);
}

export function getSampleGranuDrumSeries(
  sampleId: string,
  series: GranuDrumSeries[],
  testType?: string,
): GranuDrumSeries[] {
  return series
    .filter((row) => row.sample_id === sampleId && (!testType || row.test_type === testType))
    .sort((a, b) => a.repeat - b.repeat);
}

export function getRelationshipRows(
  sampleIds: string[],
  samples: Sample[],
  measurements: Measurement[],
  xMetric: MetricKey,
  yMetric: MetricKey,
): RelationshipRow[] {
  const ids = new Set(sampleIds);

  return samples
    .filter((sample) => ids.has(sample.sample_id))
    .map((sample) => {
      const x = getMetricStats(sample.sample_id, xMetric, measurements);
      const y = getMetricStats(sample.sample_id, yMetric, measurements);

      return {
        sample_id: sample.sample_id,
        display_name: sample.display_name,
        alloy: sample.alloy,
        powder_state: sample.powder_state,
        x: x.mean,
        y: y.mean,
        xN: x.n,
        yN: y.n,
      };
    });
}

export function getHausnerQualityBand(value: number): HausnerQualityBand {
  if (value <= 1.1) {
    return { label: "Excellent", min: 1, max: 1.1, color: "#dcefe5" };
  }

  if (value <= 1.2) {
    return { label: "Good", min: 1.1, max: 1.2, color: "#eef3cf" };
  }

  if (value <= 1.25) {
    return { label: "Passable", min: 1.2, max: 1.25, color: "#f6e3bd" };
  }

  return { label: "Poor", min: 1.25, max: 1.5, color: "#f2d2cf" };
}

export function getHausnerQualityBands(): HausnerQualityBand[] {
  return [
    { label: "Excellent", min: 1, max: 1.1, color: "#dcefe5" },
    { label: "Good", min: 1.1, max: 1.2, color: "#eef3cf" },
    { label: "Passable", min: 1.2, max: 1.25, color: "#f6e3bd" },
    { label: "Poor", min: 1.25, max: 1.5, color: "#f2d2cf" },
  ];
}

export function getSampleKeyMetrics(
  sample: Sample,
  measurements: Measurement[],
  images: AtlasImage[],
  granudrumSeries: GranuDrumSeries[] = [],
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
    availableMethods: getAvailableMethods(sample.sample_id, measurements, images, granudrumSeries),
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

function findMetricKey(method: string, metric: string): MetricKey | undefined {
  return atlasMetricOrder.find((metricKey) => {
    const definition = metricDefinitions[metricKey];
    return definition.method === method && definition.sourceMetric === metric;
  });
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
