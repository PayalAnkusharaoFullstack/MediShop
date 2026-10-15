export default function DashboardSummary({ variant = "dashboard", label = "Dashboard summary", items }) {
  return (
    <section className={`${variant}-summary`} aria-label={label}>
      {items.map((item) => (
        <div className={`summary-card summary-${item.tone}`} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </section>
  );
}