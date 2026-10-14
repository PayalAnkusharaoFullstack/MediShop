import { useMemo, useState } from "react";

function isExpired(expiryDate) {
  if (!expiryDate) return false;
  const expiry = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry.getTime() < today.getTime();
}

function getApprovedMedicines() {
  try {
    const medicines = JSON.parse(localStorage.getItem("medicines") || "[]");
    return Array.isArray(medicines)
      ? medicines.filter((medicine) => medicine.status === "Approved" && !isExpired(medicine.expiryDate))
      : [];
  } catch {
    return [];
  }
}

function getDoctorPrescriptions() {
  try {
    const prescriptions = JSON.parse(localStorage.getItem("doctorPrescriptions") || "[]");
    return Array.isArray(prescriptions) ? prescriptions : [];
  } catch {
    return [];
  }
}

function getDoctorQueries() {
  try {
    const queries = JSON.parse(localStorage.getItem("doctorQueries") || "[]");
    return Array.isArray(queries) ? queries : [];
  } catch {
    return [];
  }
}

function getDoctorDirectory() {
  try {
    const doctors = JSON.parse(localStorage.getItem("doctors") || "[]");
    return Array.isArray(doctors) ? doctors : [];
  } catch {
    return [];
  }
}

function getLoggedInDoctor() {
  try {
    const savedDoctor = JSON.parse(localStorage.getItem("loggedInDoctor") || "null");
    if (!savedDoctor?.name) return null;

    const doctor = {
      id: savedDoctor.id || savedDoctor.name.trim().toLowerCase(),
      name: savedDoctor.name.trim(),
    };
    const doctors = getDoctorDirectory();
    if (!doctors.some((item) => item.id === doctor.id)) {
      localStorage.setItem("doctors", JSON.stringify([...doctors, doctor]));
    }
    localStorage.setItem("loggedInDoctor", JSON.stringify(doctor));
    return doctor;
  } catch {
    return null;
  }
}

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(getLoggedInDoctor);
  const [medicines] = useState(getApprovedMedicines);
  const [prescriptions, setPrescriptions] = useState(getDoctorPrescriptions);
  const [queries, setQueries] = useState(getDoctorQueries);
  const [search, setSearch] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedQueryId, setSelectedQueryId] = useState("");
  const [selectedMedicineId, setSelectedMedicineId] = useState(() => {
    const approved = getApprovedMedicines();
    return approved[0]?.id ?? "";
  });
  const [quantity, setQuantity] = useState(1);

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medicines.filter((medicine) => {
      if (!query) return true;

      return [medicine.name, medicine.supplierName, medicine.description]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [medicines, search]);

  const selectedMedicine = medicines.find((medicine) => medicine.id === Number(selectedMedicineId)) || medicines[0] || null;

  const doctorPrescriptions = prescriptions.filter((item) =>
    item.doctorId === doctor?.id || item.doctorName === doctor?.name
  );
  const doctorQueries = queries.filter((item) => String(item.doctorId) === String(doctor?.id));
  const pendingQueries = doctorQueries.filter((item) => item.status === "Pending");
  const selectedQuery = pendingQueries.find((item) => String(item.id) === selectedQueryId);

  const handleDoctorLogin = (event) => {
    event.preventDefault();

    if (!loginName.trim() || loginPassword !== "2222") {
      setLoginError("Enter your name and the correct shared password.");
      return;
    }

    const cleanName = loginName.trim();
    const doctorList = getDoctorDirectory();
    const existingDoctor = doctorList.find((item) => item.name?.toLowerCase() === cleanName.toLowerCase());
    const loggedInDoctor = existingDoctor || { id: cleanName.toLowerCase(), name: cleanName };
    if (!existingDoctor) {
      localStorage.setItem("doctors", JSON.stringify([...doctorList, loggedInDoctor]));
    }
    localStorage.setItem("loggedInDoctor", JSON.stringify(loggedInDoctor));
    setDoctor(loggedInDoctor);
    setLoginPassword("");
    setLoginError("");
  };

  const handleDoctorLogout = () => {
    localStorage.removeItem("loggedInDoctor");
    setDoctor(null);
  };

  const handleAddPrescription = (e) => {
    e.preventDefault();

    if (!selectedMedicine) {
      alert("Please select a medicine first.");
      return;
    }

    if (!selectedQuery) {
      alert("Select a pending customer query first.");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (qty > Number(selectedMedicine.quantity)) {
      alert(`Only ${selectedMedicine.quantity} units are available for ${selectedMedicine.name}.`);
      return;
    }

    const prescription = {
      id: Date.now(),
      customerId: selectedQuery.customerId,
      customerName: selectedQuery.customerName,
      queryId: selectedQuery.id,
      doctorId: doctor.id,
      doctorName: doctor.name,
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.name,
      quantity: qty,
      supplierName: selectedMedicine.supplierName || "Supplier",
      prescribedAt: new Date().toLocaleString(),
    };

    const nextPrescriptions = [prescription, ...prescriptions];
    setPrescriptions(nextPrescriptions);
    localStorage.setItem("doctorPrescriptions", JSON.stringify(nextPrescriptions));

    const updatedQueries = queries.map((query) => query.id === selectedQuery.id
      ? {
          ...query,
          status: "Answered",
          reply: `Prescription issued: ${selectedMedicine.name}, quantity ${qty}.`,
          prescriptionId: prescription.id,
        }
      : query
    );
    setQueries(updatedQueries);
    localStorage.setItem("doctorQueries", JSON.stringify(updatedQueries));

    setSelectedQueryId("");
    setQuantity(1);
    setSelectedMedicineId(medicines[0]?.id ?? "");
    alert("Prescription added successfully.");
  };

  if (!doctor) {
    return (
      <div className="doctor-dashboard">
        <div className="container py-4">
          <section className="doctor-login-card">
            <p className="dashboard-kicker">MEDISHOP CLINIC</p>
            <h2>Doctor Sign In</h2>
            <p>Sign in with your name and the shared doctor password.</p>
            <form onSubmit={handleDoctorLogin}>
              <label className="form-label" htmlFor="doctor-login-name">Doctor name</label>
              <input
                id="doctor-login-name"
                className="form-control mb-3"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="Enter your name"
                autoComplete="username"
                required
              />
              <label className="form-label" htmlFor="doctor-login-password">Password</label>
              <input
                id="doctor-login-password"
                className="form-control mb-3"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Enter shared password"
                autoComplete="current-password"
                required
              />
              {loginError && <p className="doctor-login-error" role="alert">{loginError}</p>}
              <button className="btn doctor-prescribe-btn w-100" type="submit">Sign in</button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <div className="container py-4">
        <div className="doctor-hero">
          <div>
            <p className="dashboard-kicker">DOCTOR PANEL</p>
            <h2>Doctor Dashboard</h2>
            <p className="dashboard-subtitle">Signed in as {doctor.name}. Create prescriptions from approved medicines.</p>
          </div>
          <button className="btn btn-outline-light dashboard-logout" onClick={handleDoctorLogout}>
            Logout
          </button>
        </div>

        <div className="doctor-summary">
          <div className="summary-card summary-primary">
            <span>Available medicines</span>
            <strong>{medicines.length}</strong>
          </div>
          <div className="summary-card summary-warning">
            <span>Pending queries</span>
            <strong>{pendingQueries.length}</strong>
          </div>
          <div className="summary-card summary-success">
            <span>Prescriptions</span>
            <strong>{doctorPrescriptions.length}</strong>
          </div>
        </div>

        <div className="doctor-layout">
          <div className="doctor-panel">
            <div className="panel-heading doctor-heading">
              <h4>Medicine Inventory</h4>
              <div className="doctor-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search medicine or supplier"
                  aria-label="Search medicine or supplier"
                />
              </div>
            </div>

            {filteredMedicines.length === 0 ? (
              <div className="doctor-empty-box">
                No approved medicines match your search right now.
              </div>
            ) : (
              <div className="row g-4 p-3">
                {filteredMedicines.map((medicine) => (
                  <div className="col-md-6 col-xl-4" key={medicine.id}>
                    <div className="card doctor-card h-100 shadow-sm border-0">
                      <div className="card-body">
                        <div className="doctor-card-top">
                          <span className="badge bg-success">Approved</span>
                          <span className={`stock-pill ${Number(medicine.quantity) <= 10 ? "low" : ""}`}>
                            {medicine.quantity} units
                          </span>
                        </div>

                        <h5>{medicine.name}</h5>
                        <p className="doctor-description">{medicine.description}</p>

                        <div className="doctor-meta">
                          <div>
                            <small>Supplier</small>
                            <strong>{medicine.supplierName || "Supplier"}</strong>
                          </div>
                          <div>
                            <small>Price</small>
                            <strong>₹{medicine.price}</strong>
                          </div>
                        </div>

                        <button
                          className="btn doctor-select-btn mt-3 w-100"
                          onClick={() => setSelectedMedicineId(String(medicine.id))}
                        >
                          Select for prescription
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="doctor-side-panel">
            <div className="doctor-list-card">
              <h4>Customer Queries</h4>
              {doctorQueries.length === 0 ? (
                <p className="doctor-empty-mini">No customer queries yet.</p>
              ) : (
                <ul className="doctor-prescription-list">
                  {doctorQueries.map((query) => (
                    <li className="doctor-query-item" key={query.id}>
                      <div>
                        <strong>{query.customerName}</strong>
                        <span>{query.question}</span>
                        <small>{query.createdAt}</small>
                      </div>
                      <button
                        className="btn btn-sm doctor-query-select"
                        type="button"
                        disabled={query.status !== "Pending"}
                        onClick={() => setSelectedQueryId(String(query.id))}
                      >
                        {query.status === "Pending" ? "Respond" : "Answered"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="doctor-form-card">
              <h4>Create Prescription</h4>

              <form onSubmit={handleAddPrescription}>
                {selectedQuery ? (
                  <div className="doctor-selection-info mb-3">
                    <strong>For {selectedQuery.customerName}</strong>
                    <span>{selectedQuery.question}</span>
                  </div>
                ) : (
                  <p className="doctor-empty-mini">Select a pending customer query to respond.</p>
                )}

                <label className="form-label">Medicine</label>
                <select
                  className="form-select mb-3"
                  value={selectedMedicineId}
                  onChange={(e) => setSelectedMedicineId(e.target.value)}
                  disabled={!selectedQuery || medicines.length === 0}
                >
                  {medicines.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name}
                    </option>
                  ))}
                </select>

                <label className="form-label">Quantity</label>
                <input
                  className="form-control mb-3"
                  type="number"
                  min="1"
                  max={selectedMedicine?.quantity || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!selectedQuery}
                  required
                />

                <div className="doctor-selection-info mb-3">
                  {selectedMedicine ? (
                    <>
                      <strong>{selectedMedicine.name}</strong>
                      <span>{selectedMedicine.quantity} units available</span>
                    </>
                  ) : (
                    <span>No medicine selected</span>
                  )}
                </div>

                <button type="submit" className="btn doctor-prescribe-btn w-100" disabled={!selectedQuery || !selectedMedicine}>
                  Add Prescription
                </button>
              </form>
            </div>

            <div className="doctor-list-card">
              <h4>Recent Prescriptions</h4>

              {doctorPrescriptions.length === 0 ? (
                <p className="doctor-empty-mini">No prescriptions yet.</p>
              ) : (
                <ul className="doctor-prescription-list">
                  {doctorPrescriptions.slice(0, 5).map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.customerName || item.patientName}</strong>
                        <span>{item.medicineName}</span>
                      </div>
                      <small>{item.quantity} pcs</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
