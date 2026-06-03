export default function EmptyChartState({ title, message }: { title: string; message: string }) {
  return (
    <div className="chart-empty">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
