import { useMemo, useState } from "react";
import "./AdminDashboard.css";

const filters = ["All medicines", "Needs review", "Approved", "Rejected"];

function getMedicines() {
  try {
    const stored = JSON.parse(localStorage.getItem("medicines") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function getExpiryInfo(expiryDate) {
  if (!expiryDate) return { status: "missing", daysRemaining: null };

  const expiry = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return { status: "missing", daysRemaining: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);

  if (daysRemaining < 0) return { status: "expired", daysRemaining };
  if (daysRemaining <= 30) return { status: "soon", daysRemaining };
  return { status: "valid", daysRemaining };
}

export default function AdminDashboard() {
  const [medicines, setMedicines] = useState(getMedicines);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [search, setSearch] = useState("");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const isLowStock = (medicine) => medicine.status === "Approved" && Number(medicine.quantity) <= 10;

  const counts = useMemo(() => ({
    pending: medicines.filter((medicine) => medicine.status === "Pending").length,
    approved: medicines.filter((medicine) => medicine.status === "Approved").length,
    rejected: medicines.filter((medicine) => medicine.status === "Rejected").length,
    lowStock: medicines.filter(isLowStock).length,
  }), [medicines]);

  const expiryWarnings = medicines
    .filter((medicine) => medicine.status !== "Rejected")
    .map((medicine) => ({ medicine, expiry: getExpiryInfo(medicine.expiryDate) }))
    .filter(({ expiry }) => expiry.status !== "valid");

  const visibleMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...medicines]
      .filter((medicine) => {
        const matchesFilter = activeFilter === "All medicines"
          || (activeFilter === "Needs review" && medicine.status === "Pending")
          || medicine.status === activeFilter;
        const matchesSearch = !query || [medicine.name, medicine.supplierName, medicine.description, medicine.expiryDate]
          .some((value) => String(value || "").toLowerCase().includes(query));

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.id || 0).getTime();
        const dateB = new Date(b.createdAt || b.id || 0).getTime();
        return dateB - dateA;
      });
  }, [activeFilter, medicines, search]);

  const updateStatus = (id, status) => {
    const updatedMedicines = medicines.map((medicine) =>
      medicine.id === id ? { ...medicine, status } : medicine
    );

    setMedicines(updatedMedicines);
    localStorage.setItem("medicines", JSON.stringify(updatedMedicines));
  };

  const lowStockMedicines = medicines
    .filter(isLowStock)
    .slice(0, 4);

  return (
    <main className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">MEDISHOP / OPERATIONS</p>
          <h1>{greeting}, Admin</h1>
          <p className="admin-subtitle">Here is what is happening across your medicine catalog today.</p>
        </div>
        <div className="admin-date">
          <span className="admin-date-mark" aria-hidden="true">◷</span>
          <span>{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span>
        </div>
      </div>

      {expiryWarnings.length > 0 && (
        <section className="admin-expiry-alert" role="alert" aria-live="polite">
          <div className="admin-expiry-alert-heading">
            <span className="admin-expiry-alert-icon" aria-hidden="true">!</span>
            <div>
              <p className="admin-eyebrow">STOCK SAFETY</p>
              <h2>Expiry attention needed</h2>
            </div>
            <strong>{expiryWarnings.length}</strong>
          </div>
          <ul className="admin-expiry-alert-list">
            {expiryWarnings.slice(0, 5).map(({ medicine, expiry }) => (
              <li key={medicine.id}>
                <span className="admin-expiry-alert-name">{medicine.name || "Untitled medicine"}</span>
                <span className={`admin-expiry-tag admin-expiry-tag-${expiry.status}`}>
                  {expiry.status === "expired"
                    ? "Expired"
                    : expiry.status === "soon"
                    ? `${expiry.daysRemaining} days left`
                    : "Date missing"}
                </span>
              </li>
            ))}
          </ul>
          {expiryWarnings.length > 5 && <p className="admin-expiry-more">And {expiryWarnings.length - 5} more items need attention.</p>}
        </section>
      )}

      <section className="admin-stat-grid" aria-label="Catalog summary">
        <article className="admin-stat admin-stat-total">
          <div className="admin-stat-top"><span>Total medicines</span><span className="admin-stat-icon">＋</span></div>
          <strong>{medicines.length}</strong>
          <small>In your catalog</small>
        </article>
        <article className="admin-stat admin-stat-pending">
          <div className="admin-stat-top"><span>Needs review</span><span className="admin-stat-icon">!</span></div>
          <strong>{counts.pending}</strong>
          <small>Awaiting your decision</small>
        </article>
        <article className="admin-stat admin-stat-approved">
          <div className="admin-stat-top"><span>Approved</span><span className="admin-stat-icon">✓</span></div>
          <strong>{counts.approved}</strong>
          <small>Available for customers</small>
        </article>
        <article className="admin-stat admin-stat-stock">
          <div className="admin-stat-top"><span>Low stock</span><span className="admin-stat-icon">↓</span></div>
          <strong>{counts.lowStock}</strong>
          <small>10 units or fewer</small>
        </article>
      </section>

      <section className="admin-workspace">
        <div className="admin-catalog-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">CATALOG</p>
              <h2>Medicine submissions</h2>
            </div>
            <span className="admin-result-count">{visibleMedicines.length} shown</span>
          </div>

          <div className="admin-toolbar">
            <div className="admin-tabs" role="group" aria-label="Filter medicines">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={activeFilter === filter}
                  className={activeFilter === filter ? "active" : ""}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                  {filter === "Needs review" && counts.pending > 0 && <span className="admin-tab-count">{counts.pending}</span>}
                </button>
              ))}
            </div>
            <label className="admin-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search medicines or suppliers"
                aria-label="Search medicines or suppliers"
              />
            </label>
          </div>

          {visibleMedicines.length === 0 ? (
            <div className="admin-empty-state">
              <span className="admin-empty-icon" aria-hidden="true">＋</span>
              <h3>{medicines.length === 0 ? "Your catalog is ready" : "No matching medicines"}</h3>
              <p>{medicines.length === 0 ? "Supplier submissions will appear here when they are added." : "Try another search or choose a different status filter."}</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">MEDICINE</th>
                    <th scope="col">SUPPLIER</th>
                    <th scope="col">PRICE</th>
                    <th scope="col">ON HAND</th>
                    <th scope="col">EXPIRY</th>
                    <th scope="col">STATUS</th>
                    <th scope="col">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMedicines.map((medicine) => {
                    const expiry = getExpiryInfo(medicine.expiryDate);
                    return (
                    <tr key={medicine.id}>
                      <td>
                        <div className="admin-medicine-name">{medicine.name || "Untitled medicine"}</div>
                        <div className="admin-medicine-detail">{medicine.description || "No description provided"}</div>
                      </td>
                      <td>{medicine.supplierName || "Supplier"}</td>
                      <td className="admin-price">₹{medicine.price ?? "—"}</td>
                      <td><span className={Number(medicine.quantity) <= 10 ? "admin-quantity low" : "admin-quantity"}>{medicine.quantity ?? "—"} <small>units</small></span></td>
                      <td><span className={`admin-expiry-cell admin-expiry-cell-${expiry.status}`}>{medicine.expiryDate || "Missing date"}</span></td>
                      <td><span className={`admin-status status-${String(medicine.status || "Pending").toLowerCase()}`}>{medicine.status || "Pending"}</span></td>
                      <td>
                        {(!medicine.status || medicine.status === "Pending") ? (
                          <div className="admin-actions">
                            <button type="button" className="admin-approve" onClick={() => updateStatus(medicine.id, "Approved")}>Approve</button>
                            <button type="button" className="admin-reject" onClick={() => updateStatus(medicine.id, "Rejected")}>Reject</button>
                          </div>
                        ) : <span className="admin-reviewed">Reviewed</span>}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="admin-side-panel">
          <div className="admin-side-heading">
            <div>
              <p className="admin-eyebrow">STOCK CHECK</p>
              <h2>Running low</h2>
            </div>
            <span className="admin-side-count">{counts.lowStock}</span>
          </div>
          {lowStockMedicines.length ? (
            <ul className="admin-low-stock-list">
              {lowStockMedicines.map((medicine) => (
                <li key={medicine.id}>
                  <span className="admin-stock-dot" aria-hidden="true" />
                  <span className="admin-low-stock-name">{medicine.name || "Untitled medicine"}<small>{medicine.supplierName || "Supplier"}</small></span>
                  <strong>{medicine.quantity ?? 0}<small> left</small></strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-side-empty">Stock levels look healthy. Medicines with 10 units or fewer will appear here.</p>
          )}
          <div className="admin-review-note">
            <span className="admin-note-mark" aria-hidden="true">✓</span>
            <div><strong>Review queue</strong><p>{counts.pending ? `${counts.pending} submission${counts.pending === 1 ? "" : "s"} waiting for approval.` : "You are all caught up on submissions."}</p></div>
          </div>
        </aside>
      </section>
    </main>
  );
}