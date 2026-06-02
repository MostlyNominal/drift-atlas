// Shared types mirroring the processed JSON emitted by scripts/process_data.py

export interface Stat {
  n: number;
  mean: number | null;
  sd: number | null; // null when n < 2  -> hide error bars
  sem: number | null;
}

export interface RunMetadata {
  material: string | null;
  supplier: string | null;
  nominal_psd: string | null;
  conditioning: string | null;
  humidity_pct: number | null;
  reuse_cycle: number | null;
  operator: string | null;
  instrument: string | null;
  run_datetime: string | null;
  test_mode: string | null;
}

export interface RunIndexEntry {
  run_id: string;
  sample_id: string;
  batch_id: string;
  method: string;
  n: number;
  metadata: RunMetadata;
}

export interface RunSummary {
  method: string;
  sample_id: string;
  batch_id: string;
  metadata: RunMetadata;
  stats: Record<string, Stat>;
}

export interface RunDoc extends RunIndexEntry {
  raw_file: { original_name: string; sha256: string; path: string };
  repeats: Record<string, unknown>[];
  children: Record<string, Record<string, unknown>[]>;
  detected: Record<string, unknown>;
}

export interface Batch {
  batch_id: string;
  conditioning?: string;
  humidity_pct?: number;
  reuse_cycle?: number;
  [k: string]: unknown;
}

export interface Sample {
  sample_id: string;
  material?: string;
  supplier?: string;
  nominal_psd?: string;
  batches: Batch[];
  [k: string]: unknown;
}

export interface Manifest {
  generated_at: string;
  n_samples: number;
  n_runs: number;
  methods: string[];
  warnings: string[];
}

export interface SemImage {
  sample_id: string | null;
  run_id: string | null;
  magnification: number | null;
  detector: string | null;
  accelerating_voltage_kV: number | null;
  working_distance_mm: number | null;
  notes: string | null;
  image_path: string;
  thumbnail: string;
}
