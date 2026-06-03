export interface Sample {
  sample_id: string;
  display_name: string;
  alloy: string;
  supplier: string;
  batch: string;
  lot_number: string;
  powder_state: string;
  psd_class: string;
  storage_condition: string;
  conditioning: string;
  tags: string[];
  notes: string;
  featured?: boolean;
}

export interface Measurement {
  measurement_id: string;
  sample_id: string;
  method: string;
  metric: string;
  value: number;
  unit: string;
  repeat: number;
  date: string;
  method_version: string;
  instrument: string;
  notes: string;
}

export interface AtlasImage {
  image_id: string;
  sample_id: string;
  image_path: string;
  thumbnail_path: string;
  type: string;
  magnification: string;
  detector: string;
  accelerating_voltage_kV: number;
  working_distance_mm: number;
  notes: string;
}

export interface MethodDefinition {
  method_id: string;
  name: string;
  purpose: string;
  version: string;
  key_parameters: string[];
  interpretation_notes: string[];
  future_status: "MVP" | "Future";
}

export interface Stat {
  n: number;
  mean: number | null;
  sd: number | null;
  sem: number | null;
}

export interface MetricStat extends Stat {
  key: MetricKey;
  label: string;
  unit: string;
  values: number[];
}

export type MetricKey =
  | "d10"
  | "d50"
  | "d90"
  | "span"
  | "moisture"
  | "bulkDensity"
  | "tappedDensity"
  | "hausnerRatio"
  | "carrIndex";

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  method: string;
  sourceMetric: string | null;
  unit: string;
  precision: number;
}

export interface SampleKeyMetrics {
  d10: MetricStat;
  d50: MetricStat;
  d90: MetricStat;
  span: MetricStat;
  moisture: MetricStat;
  bulkDensity: MetricStat;
  tappedDensity: MetricStat;
  hausnerRatio: MetricStat;
  carrIndex: MetricStat;
  semImageCount: number;
  availableMethods: string[];
}

export interface AtlasData {
  samples: Sample[];
  measurements: Measurement[];
  images: AtlasImage[];
  methods: MethodDefinition[];
}

export interface SummaryCounts {
  sampleCount: number;
  alloyCount: number;
  methodCount: number;
  measurementCount: number;
}
