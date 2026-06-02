import { useEffect, useState } from "react";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fn()
      .then((data) => alive && setState({ data, loading: false }))
      .catch((e) => alive && setState({ error: String(e), loading: false }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {children}
    </section>
  );
}

/** Always show n; this badge makes the n explicit next to every statistic. */
export function NBadge({ n }: { n: number }) {
  return <span className={`nbadge ${n > 1 ? "multi" : "single"}`}>n={n}{n === 1 ? " (no error bars)" : ""}</span>;
}

export function Loading({ s }: { s: { loading: boolean; error?: string } }) {
  if (s.loading) return <p>Loading…</p>;
  if (s.error) return <p className="error">⚠ {s.error}</p>;
  return null;
}
