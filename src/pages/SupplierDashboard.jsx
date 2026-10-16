import { useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardHero from "../components/dashboard/DashboardHero";
import DashboardSummary from "../components/dashboard/DashboardSummary";

function getTodayDateValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export default function SupplierDashboard() {
  const [supplier, setSupplier] = useState(() =>
    JSON.parse(localStorage.getItem("loggedInSupplier") || "null")
  );

  const [medicines, setMedicines] = useState(() =>
    JSON.parse(localStorage.getItem("medicines") || "[]")
  );

  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "",
    expiryDate: "",
    description: "",
  });

  const handleLogout = () => {
    localStorage.removeItem("loggedInSupplier");
    setSupplier(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newMedicine = {
      ...form,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      price: Number(form.price),
      quantity: Number(form.quantity),
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: "Pending",
    };

    const updated = [...medicines, newMedicine];

    localStorage.setItem("medicines", JSON.stringify(updated));
    setMedicines(updated);

    setForm({
      name: "",
      price: "",
      quantity: "",
      expiryDate: "",
      description: "",
    });

    alert("Medicine submitted for admin approval!");
  };

  if (!supplier) {
    return <Navigate to="/?role=supplier" replace />;
  }

  const myMedicines = medicines.filter(
    (medicine) => medicine.supplierId === supplier.id
  );

  return (
    <div className="supplier-dashboard container py-4">
      <DashboardHero
        variant="dashboard"
        kicker="SUPPLIER PORTAL"
        title="Supplier Dashboard"
        subtitle={`Welcome back, ${supplier.name}`}
        action={(
          <button className="btn btn-outline-light dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      />

      <DashboardSummary
        variant="dashboard"
        label="Supplier summary"
        items={[
          { label: "Total submissions", value: myMedicines.length, tone: "primary" },
          { label: "Pending", value: myMedicines.filter((item) => item.status === "Pending").length, tone: "warning" },
          { label: "Approved", value: myMedicines.filter((item) => item.status === "Approved").length, tone: "success" },
        ]}
      />

      <div className="card dashboard-panel shadow-sm border-0 mb-4">
        <div className="card-header dashboard-card-header">Add Medicine</div>

        <div className="card-body dashboard-card-body">
          <form onSubmit={handleSubmit}>
            <label className="form-label">Medicine Name</label>
            <input
              className="form-control mb-3"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Price (₹)</label>
                <input
                  className="form-control"
                  type="number"
                  name="price"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Quantity</label>
                <input
                  className="form-control"
                  type="number"
                  name="quantity"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">Expiry Date</label>
                <input
                  className="form-control"
                  type="date"
                  name="expiryDate"
                  min={getTodayDateValue()}
                  value={form.expiryDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label className="form-label">Description</label>
            <textarea
              className="form-control mb-3"
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
              required
            />

            <button type="submit" className="btn dashboard-submit-btn">
              Submit for Approval
            </button>
          </form>
        </div>
      </div>

      <div className="dashboard-panel table-panel">
        <div className="panel-heading">
          <h4>My Submitted Medicines</h4>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-striped mb-0 supplier-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {myMedicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td>{medicine.name}</td>
                  <td>₹{medicine.price}</td>
                  <td>{medicine.quantity}</td>
                  <td>{medicine.expiryDate || "Not provided"}</td>
                  <td>
                    <span
                      className={`badge ${
                        medicine.status === "Approved"
                          ? "bg-success"
                          : medicine.status === "Rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {medicine.status}
                    </span>
                  </td>
                </tr>
              ))}

              {myMedicines.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    No medicines submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
