export default function DashboardHero({ variant = "dashboard", kicker, title, subtitle, action }) {
  return (
    <header className={`${variant}-hero`}>
      <div>
        <p className="dashboard-kicker">{kicker}</p>
        <h2>{title}</h2>
        {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}