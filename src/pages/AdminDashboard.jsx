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

function getStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getAdminSession(admins) {
  try {
    const session = JSON.parse(localStorage.getItem("loggedInAdmin") || "null");
    if (!session || typeof session !== "object") return null;

    const admin = admins.find((item) =>
      String(item.id) === String(session.id)
      && String(item.email || "").toLowerCase() === String(session.email || "").toLowerCase()
    );
    return admin ? { id: admin.id, name: admin.name, email: admin.email } : null;
  } catch {
    return null;
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

export default function AdminDashboard({ superAdminMode = false }) {
  const [medicines, setMedicines] = useState(getMedicines);
  const [orders] = useState(() => getStoredArray("orders"));
  const [customers] = useState(() => getStoredArray("customers"));
  const [prescriptions] = useState(() => getStoredArray("doctorPrescriptions"));
  const [admins, setAdmins] = useState(() => getStoredArray("admins"));
  const [loggedInAdmin, setLoggedInAdmin] = useState(() => getAdminSession(getStoredArray("admins")));
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [adminMessage, setAdminMessage] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
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

  const handleAddAdmin = (event) => {
    event.preventDefault();
    if (!superAdminMode) {
      setAdminMessage("Only a super admin can add admin accounts.");
      return;
    }

    const email = adminForm.email.trim().toLowerCase();

    if (admins.some((admin) => admin.email?.toLowerCase() === email)) {
      setAdminMessage("An admin account already uses this email.");
      return;
    }

    const newAdmin = {
      id: Date.now(),
      name: adminForm.name.trim(),
      email,
      password: adminForm.password,
      createdAt: new Date().toISOString(),
    };
    const updatedAdmins = [...admins, newAdmin];
    setAdmins(updatedAdmins);
    localStorage.setItem("admins", JSON.stringify(updatedAdmins));
    setAdminForm({ name: "", email: "", password: "" });
    setAdminMessage(`Admin account created for ${newAdmin.name}.`);
  };

  const handleAdminLogin = (event) => {
    event.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    const admin = admins.find((item) => item.email?.toLowerCase() === email && item.password === loginForm.password);

    if (!admin) {
      setLoginError("Email or password is incorrect.");
      return;
    }

    const session = { id: admin.id, name: admin.name, email: admin.email };
    localStorage.setItem("loggedInAdmin", JSON.stringify(session));
    setLoggedInAdmin(session);
    setLoginForm({ email: "", password: "" });
    setLoginError("");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("loggedInAdmin");
    setLoggedInAdmin(null);
  };

  const lowStockMedicines = medicines
    .filter(isLowStock)
    .slice(0, 4);
  const orderRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  if (!superAdminMode && !loggedInAdmin) {
    return (
      <main className="admin-login-page">
        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <p className="admin-eyebrow">MEDISHOP / ADMIN PORTAL</p>
          <h1 id="admin-login-title">Admin login</h1>
          <p>Sign in with the email and password provided by your super admin.</p>
          <form onSubmit={handleAdminLogin}>
            <label htmlFor="admin-login-email">Email address</label>
            <input
              id="admin-login-email"
              type="email"
              autoComplete="username"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
              required
            />
            <label htmlFor="admin-login-password">Password</label>
            <input
              id="admin-login-password"
              type="password"
              autoComplete="current-password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              required
            />
            {loginError && <p className="admin-login-error" role="alert">{loginError}</p>}
            <button type="submit">Sign in</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={`admin-dashboard${superAdminMode ? " super-admin-dashboard" : ""}`}>
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">MEDISHOP / {superAdminMode ? "SUPER ADMIN" : "OPERATIONS"}</p>
          <h1>{greeting}, {superAdminMode ? "Super Admin" : "Admin"}</h1>
          <p className="admin-subtitle">{superAdminMode ? "Platform reports, medicine approvals, and stock oversight." : "Here is what is happening across your medicine catalog today."}</p>
        </div>
        <div className="admin-header-actions">
          <div className="admin-date">
            <span className="admin-date-mark" aria-hidden="true">◷</span>
            <span>{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</span>
          </div>
          {!superAdminMode && (
            <button type="button" className="admin-logout-button" onClick={handleAdminLogout}>
              Log out
            </button>
          )}
        </div>
      </div>

      {superAdminMode && (
        <section className="super-admin-reports" aria-labelledby="super-admin-reports-title">
          <div className="super-admin-reports-heading">
            <div>
              <p className="admin-eyebrow">PLATFORM OVERVIEW</p>
              <h2 id="super-admin-reports-title">Reports</h2>
            </div>
          </div>
          <div className="super-admin-report-grid">
            <div><span>Total orders</span><strong>{orders.length}</strong></div>
            <div><span>Order value</span><strong>₹{orderRevenue.toFixed(2)}</strong></div>
            <div><span>Customer accounts</span><strong>{customers.length}</strong></div>
            <div><span>Prescriptions</span><strong>{prescriptions.length}</strong></div>
          </div>
          <div className="super-admin-recent-orders">
            <h3>Recent orders</h3>
            {orders.length === 0 ? (
              <p>No customer orders have been placed yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table super-admin-orders-table">
                  <thead><tr><th>CUSTOMER</th><th>MEDICINE</th><th>QUANTITY</th><th>VALUE</th><th>DATE</th></tr></thead>
                  <tbody>
                    {[...orders].slice(-5).reverse().map((order) => (
                      <tr key={order.id}>
                        <td>{order.customerName || "Customer"}</td>
                        <td>{order.medicineName}</td>
                        <td>{order.quantity}</td>
                        <td>₹{Number(order.total || 0).toFixed(2)}</td>
                        <td>{order.orderDate || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {superAdminMode && (
        <section className="super-admin-manage" aria-labelledby="super-admin-admins-title">
          <div className="super-admin-manage-heading">
            <div>
              <p className="admin-eyebrow">ACCESS MANAGEMENT</p>
              <h2 id="super-admin-admins-title">Admin accounts</h2>
            </div>
            <span className="super-admin-default-password">Set a unique password for each admin account.</span>
          </div>

          <form className="super-admin-add-admin-form" onSubmit={handleAddAdmin}>
            <label>
              <span>Admin name</span>
              <input
                value={adminForm.name}
                onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })}
                placeholder="Enter admin name"
                required
              />
            </label>
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={adminForm.email}
                onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })}
                placeholder="admin@example.com"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                minLength="6"
                autoComplete="new-password"
                value={adminForm.password}
                onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })}
                placeholder="At least 6 characters"
                required
              />
            </label>
            <button type="submit">Add admin</button>
          </form>

          {adminMessage && <p className="super-admin-admin-message" role="status">{adminMessage}</p>}

          {admins.length === 0 ? (
            <p className="super-admin-empty-admins">No admin accounts have been added yet.</p>
          ) : (
            <ul className="super-admin-admin-list">
              {admins.map((admin) => (
                <li key={admin.id}>
                  <div><strong>{admin.name}</strong><span>{admin.email}</span></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

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