import { useState } from "react";
import { Navigate } from "react-router-dom";

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function MRDashboard() {
  const [representative, setRepresentative] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("loggedInMR") || "null");
    } catch {
      return null;
    }
  });
  const [doctors] = useState(() => readArray("doctors"));
  const [medicines] = useState(() => readArray("medicines").filter((item) => item.status === "Approved"));
  const [visits, setVisits] = useState(() => readArray("mrVisits"));
  const [form, setForm] = useState({
    doctorId: "",
    visitDate: getToday(),
    purpose: "Product introduction",
    medicineId: "",
    notes: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const doctor = doctors.find((item) => String(item.id) === form.doctorId);
    if (!doctor) return;

    const medicine = medicines.find((item) => String(item.id) === form.medicineId);
    const visit = {
      id: Date.now(),
      doctorId: doctor.id,
      doctorName: doctor.name,
      visitDate: form.visitDate,
      purpose: form.purpose,
      medicineName: medicine?.name || "—",
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedVisits = [visit, ...visits];
    setVisits(updatedVisits);
    localStorage.setItem("mrVisits", JSON.stringify(updatedVisits));
    setForm({ ...form, doctorId: "", medicineId: "", notes: "" });
  };

  const todayVisits = visits.filter((visit) => visit.visitDate === getToday()).length;

  if (!representative) {
    return <Navigate to="/?role=mr" replace />;
  }

  return (
    <main className="mr-dashboard">
      <header className="mr-hero">
        <div>
          <p className="mr-eyebrow">MEDISHOP / FIELD TEAM</p>
          <h1>Medical Representative</h1>
          <p>Welcome, {representative.name}. Plan doctor visits and keep product discussions organized.</p>
        </div>
        <div className="mr-hero-actions">
          <span className="mr-hero-mark" aria-hidden="true">MR</span>
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => {
              localStorage.removeItem("loggedInMR");
              setRepresentative(null);
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <section className="mr-summary" aria-label="Visit and product overview">
        <div><span>Doctors</span><strong>{doctors.length}</strong></div>
        <div><span>Visits today</span><strong>{todayVisits}</strong></div>
        <div><span>Approved products</span><strong>{medicines.length}</strong></div>
      </section>

      <section className="mr-workspace">
        <form className="mr-visit-form" onSubmit={handleSubmit}>
          <p className="mr-eyebrow">FIELD ACTIVITY</p>
          <h2>Log a doctor visit</h2>

          <label className="form-label" htmlFor="mr-doctor">Doctor</label>
          <select
            id="mr-doctor"
            className="form-select mb-3"
            value={form.doctorId}
            onChange={(event) => setForm({ ...form, doctorId: event.target.value })}
            required
          >
            <option value="">Choose a doctor</option>
            {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
          </select>

          <label className="form-label" htmlFor="mr-visit-date">Visit date</label>
          <input
            id="mr-visit-date"
            className="form-control mb-3"
            type="date"
            value={form.visitDate}
            onChange={(event) => setForm({ ...form, visitDate: event.target.value })}
            required
          />

          <label className="form-label" htmlFor="mr-visit-purpose">Purpose</label>
          <select
            id="mr-visit-purpose"
            className="form-select mb-3"
            value={form.purpose}
            onChange={(event) => setForm({ ...form, purpose: event.target.value })}
          >
            <option>Product introduction</option>
            <option>Follow-up</option>
            <option>Prescription feedback</option>
            <option>Other</option>
          </select>

          <label className="form-label" htmlFor="mr-medicine">Product discussed</label>
          <select
            id="mr-medicine"
            className="form-select mb-3"
            value={form.medicineId}
            onChange={(event) => setForm({ ...form, medicineId: event.target.value })}
          >
            <option value="">Select a product (optional)</option>
            {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name}</option>)}
          </select>

          <label className="form-label" htmlFor="mr-notes">Visit notes</label>
          <textarea
            id="mr-notes"
            className="form-control mb-3"
            rows="3"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Add a short follow-up note"
          />

          <button className="btn mr-submit-btn w-100" type="submit" disabled={doctors.length === 0}>
            Save visit
          </button>
          {doctors.length === 0 && <p className="mr-empty-note">Doctor accounts will appear here after they sign in.</p>}
        </form>

        <section className="mr-visits-panel" aria-labelledby="mr-visits-heading">
          <div className="mr-visits-heading">
            <div>
              <p className="mr-eyebrow">ACTIVITY LOG</p>
              <h2 id="mr-visits-heading">Recent visits</h2>
            </div>
            <span>{visits.length} total</span>
          </div>

          {visits.length === 0 ? (
            <div className="mr-empty-state">Your doctor visit log is empty.</div>
          ) : (
            <div className="mr-visit-list">
              {visits.map((visit) => (
                <article className="mr-visit-item" key={visit.id}>
                  <span className="mr-visit-date">{visit.visitDate}</span>
                  <div className="mr-visit-content">
                    <div className="mr-visit-title">
                      <h3>Dr. {visit.doctorName}</h3>
                      <span>{visit.purpose}</span>
                    </div>
                    <p>Product: {visit.medicineName}</p>
                    {visit.notes && <p className="mr-visit-notes">{visit.notes}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}