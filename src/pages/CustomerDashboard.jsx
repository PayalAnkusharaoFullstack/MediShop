import { useState } from "react";

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readCustomerSession() {
  try {
    return JSON.parse(localStorage.getItem("loggedInCustomer") || "null");
  } catch {
    return null;
  }
}

function isExpired(expiryDate) {
  if (!expiryDate) return false;
  const expiry = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry.getTime() < today.getTime();
}

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState(readCustomerSession);
  const [registerMode, setRegisterMode] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [medicines] = useState(() => readArray("medicines").filter((medicine) =>
    medicine.status === "Approved" && !isExpired(medicine.expiryDate)
  ));
  const [orders, setOrders] = useState(() => readArray("orders"));
  const [cart, setCart] = useState(() => {
    const activeCustomer = readCustomerSession();
    return activeCustomer ? readArray(`customerCart:${activeCustomer.id}`) : [];
  });
  const [prescriptions, setPrescriptions] = useState(() => readArray("doctorPrescriptions"));
  const [queries, setQueries] = useState(() => readArray("doctorQueries"));
  const [doctors] = useState(() => readArray("doctors"));
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [queryText, setQueryText] = useState("");
  const [quantities, setQuantities] = useState({});

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    const email = authForm.email.trim().toLowerCase();
    const customers = readArray("customers");

    if (registerMode) {
      if (customers.some((item) => item.email === email)) {
        setAuthError("An account with this email already exists.");
        return;
      }

      const account = {
        id: Date.now(),
        name: authForm.name.trim(),
        email,
        password: authForm.password,
      };
      localStorage.setItem("customers", JSON.stringify([...customers, account]));
      localStorage.setItem("loggedInCustomer", JSON.stringify(account));
      setCustomer(account);
      setCart(readArray(`customerCart:${account.id}`));
      setAuthError("");
      return;
    }

    const account = customers.find((item) => item.email === email && item.password === authForm.password);
    if (!account) {
      setAuthError("Email or password is incorrect.");
      return;
    }

    localStorage.setItem("loggedInCustomer", JSON.stringify(account));
    setCustomer(account);
    setCart(readArray(`customerCart:${account.id}`));
    setAuthError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInCustomer");
    setCustomer(null);
    setCart([]);
    setAuthForm({ name: "", email: "", password: "" });
  };

  const handleSendQuery = (event) => {
    event.preventDefault();

    if (!selectedDoctorId || !queryText.trim()) return;

    const selectedDoctor = doctors.find((item) => String(item.id) === selectedDoctorId);
    if (!selectedDoctor) return;

    const newQuery = {
      id: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      question: queryText.trim(),
      status: "Pending",
      createdAt: new Date().toLocaleString(),
    };
    const updatedQueries = [newQuery, ...queries];
    setQueries(updatedQueries);
    localStorage.setItem("doctorQueries", JSON.stringify(updatedQueries));
    setQueryText("");
  };

  const saveCart = (nextCart) => {
    setCart(nextCart);
    localStorage.setItem(`customerCart:${customer.id}`, JSON.stringify(nextCart));
  };

  const addToCart = (medicine, requestedQuantity, prescriptionId = null) => {
    const quantity = Number(requestedQuantity ?? quantities[medicine.id] ?? 1);

    if (!Number.isInteger(quantity) || quantity < 1) {
      alert("Please enter a valid quantity.");
      return;
    }

    const cartItemId = `${medicine.id}-${prescriptionId || "store"}`;
    const quantityAlreadyInCart = cart
      .filter((item) => item.medicineId === medicine.id && item.id !== cartItemId)
      .reduce((total, item) => total + Number(item.quantity), 0);
    const currentLine = cart.find((item) => item.id === cartItemId);

    if (quantity + quantityAlreadyInCart + Number(currentLine?.quantity || 0) > Number(medicine.quantity)) {
      alert(`Only ${Math.max(0, Number(medicine.quantity) - quantityAlreadyInCart - Number(currentLine?.quantity || 0))} more units can be added.`);
      return;
    }

    const cartLine = {
      id: cartItemId,
      medicineId: medicine.id,
      medicineName: medicine.name,
      price: Number(medicine.price),
      quantity: Number(currentLine?.quantity || 0) + quantity,
      supplierName: medicine.supplierName || "Supplier",
      prescriptionId: prescriptionId || null,
    };

    saveCart(currentLine
      ? cart.map((item) => item.id === cartItemId ? cartLine : item)
      : [...cart, cartLine]
    );
  };

  const updateCartQuantity = (cartItemId, nextQuantity) => {
    const line = cart.find((item) => item.id === cartItemId);
    const medicine = medicines.find((item) => item.id === line?.medicineId);
    const quantity = Number(nextQuantity);

    if (!line || !medicine || !Number.isInteger(quantity) || quantity < 1) return;

    const quantityInOtherLines = cart
      .filter((item) => item.medicineId === line.medicineId && item.id !== cartItemId)
      .reduce((total, item) => total + Number(item.quantity), 0);

    if (quantity + quantityInOtherLines > Number(medicine.quantity)) {
      alert(`Only ${Number(medicine.quantity) - quantityInOtherLines} units are available.`);
      return;
    }

    saveCart(cart.map((item) => item.id === cartItemId ? { ...item, quantity } : item));
  };

  const removeCartItem = (cartItemId) => {
    saveCart(cart.filter((item) => item.id !== cartItemId));
  };

  const checkout = () => {
    if (cart.length === 0) return;

    const unavailableLine = cart.find((line) => {
      const medicine = medicines.find((item) => item.id === line.medicineId);
      return !medicine || Number(line.quantity) > Number(medicine.quantity);
    });

    if (unavailableLine) {
      alert(`${unavailableLine.medicineName} no longer has enough stock. Update your cart and try again.`);
      return;
    }

    const checkoutId = Date.now();
    const orderDate = new Date().toLocaleString();
    const newOrders = cart.map((line, index) => ({
      ...line,
      id: checkoutId + index,
      total: Number(line.price) * Number(line.quantity),
      status: "Placed",
      orderDate,
      customerId: customer.id,
      customerName: customer.name,
    }));
    const updatedOrders = [...orders, ...newOrders];
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));

    const orderedPrescriptionIds = new Set(cart.map((line) => line.prescriptionId).filter(Boolean));
    if (orderedPrescriptionIds.size > 0) {
      const updatedPrescriptions = prescriptions.map((prescription) =>
        orderedPrescriptionIds.has(prescription.id)
          ? { ...prescription, status: "Ordered" }
          : prescription
      );
      setPrescriptions(updatedPrescriptions);
      localStorage.setItem("doctorPrescriptions", JSON.stringify(updatedPrescriptions));
    }

    saveCart([]);
    alert("Order placed successfully!");
  };

  const myPrescriptions = customer
    ? prescriptions.filter((prescription) => prescription.customerId === customer.id)
    : [];
  const myQueries = customer
    ? queries.filter((query) => query.customerId === customer.id)
    : [];
  const myOrders = customer
    ? orders.filter((order) => order.customerId === customer.id)
    : [];

  const getPrescriptionMedicine = (prescription) =>
    medicines.find((medicine) => medicine.id === prescription.medicineId)
    || medicines.find((medicine) => medicine.name === prescription.medicineName);

  if (!customer) {
    return (
      <div className="customer-dashboard">
        <div className="container py-4">
          <section className="customer-auth-card">
            <p className="dashboard-kicker">MEDISHOP ACCOUNT</p>
            <h2>{registerMode ? "Create Customer Account" : "Customer Sign In"}</h2>
            <form onSubmit={handleAuthSubmit}>
              {registerMode && (
                <>
                  <label className="form-label" htmlFor="customer-name">Full name</label>
                  <input
                    id="customer-name"
                    className="form-control mb-3"
                    value={authForm.name}
                    onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                    autoComplete="name"
                    required
                  />
                </>
              )}
              <label className="form-label" htmlFor="customer-email">Email</label>
              <input
                id="customer-email"
                type="email"
                className="form-control mb-3"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                autoComplete="email"
                required
              />
              <label className="form-label" htmlFor="customer-password">Password</label>
              <input
                id="customer-password"
                type="password"
                className="form-control mb-3"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                autoComplete={registerMode ? "new-password" : "current-password"}
                minLength={6}
                required
              />
              {authError && <p className="customer-auth-error" role="alert">{authError}</p>}
              <button className="btn customer-buy-btn w-100" type="submit">
                {registerMode ? "Create account" : "Sign in"}
              </button>
            </form>
            <button
              className="btn btn-link customer-auth-toggle"
              type="button"
              onClick={() => {
                setRegisterMode(!registerMode);
                setAuthError("");
              }}
            >
              {registerMode ? "Already have an account? Sign in" : "New customer? Create an account"}
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <div className="container py-4">
        <div className="customer-hero">
          <div>
            <p className="dashboard-kicker">CUSTOMER STORE</p>
            <h2>Customer Dashboard</h2>
            <p className="dashboard-subtitle">Welcome, {customer.name}. Browse medicines and contact your doctor.</p>
          </div>
          <button className="btn btn-outline-light dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <section className="customer-prescriptions" aria-labelledby="doctor-query-heading">
          <div className="customer-section-title">
            <h4 id="doctor-query-heading">Ask a Doctor</h4>
            <p>Your questions and prescriptions are linked to your customer account.</p>
          </div>

          <form className="prescription-lookup" onSubmit={handleSendQuery}>
            <label className="form-label" htmlFor="doctor-select">Choose doctor</label>
            <select
              id="doctor-select"
              className="form-select mb-3"
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              required
            >
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
              ))}
            </select>
            <label className="form-label" htmlFor="doctor-question">Your question</label>
            <textarea
              id="doctor-question"
              className="form-control mb-3"
              rows="3"
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              placeholder="Describe what you need help with"
              required
            />
            <button className="btn customer-buy-btn" type="submit" disabled={doctors.length === 0}>
              Send to doctor
            </button>
            {doctors.length === 0 && <p className="customer-auth-error mt-3">No doctors are available yet.</p>}
          </form>

          <div className="customer-query-list">
            <h5>My doctor queries</h5>
            {myQueries.length === 0 ? (
              <p className="doctor-empty-mini">You have not sent a query yet.</p>
            ) : myQueries.map((query) => (
              <article className="customer-query-item" key={query.id}>
                <div>
                  <strong>Dr. {query.doctorName}</strong>
                  <p>{query.question}</p>
                  {query.reply && <p className="customer-query-reply">{query.reply}</p>}
                </div>
                <span className={`prescription-status${query.status === "Answered" ? " ordered" : ""}`}>
                  {query.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="customer-prescriptions" aria-labelledby="prescriptions-heading">
          <div className="customer-section-title">
            <h4 id="prescriptions-heading">My Prescriptions</h4>
            <p>Prescriptions from doctors you contacted appear here.</p>
          </div>
          {myPrescriptions.length === 0 ? (
            <div className="customer-empty-box">No prescriptions have been issued to your account yet.</div>
          ) : (
            <div className="row g-3">
              {myPrescriptions.map((prescription) => {
                const medicine = getPrescriptionMedicine(prescription);
                const alreadyOrdered = prescription.status === "Ordered";
                const canOrder = medicine && Number(medicine.quantity) >= Number(prescription.quantity);

                return (
                  <div className="col-md-6 col-xl-4" key={prescription.id}>
                    <article className="prescription-card">
                      <div className="prescription-card-heading">
                        <div>
                          <span className="prescription-label">PRESCRIBED MEDICINE</span>
                          <h5>{prescription.medicineName}</h5>
                        </div>
                        <span className={`prescription-status${alreadyOrdered ? " ordered" : ""}`}>
                          {alreadyOrdered ? "Ordered" : "Ready"}
                        </span>
                      </div>
                      <p>Quantity: <strong>{prescription.quantity}</strong></p>
                      <p>Doctor: <strong>{prescription.doctorName}</strong></p>
                      <button
                        className="btn customer-buy-btn w-100"
                        disabled={alreadyOrdered || !canOrder}
                        onClick={() => medicine && addToCart(medicine, prescription.quantity, prescription.id)}
                      >
                        {alreadyOrdered ? "Already ordered" : canOrder ? "Add prescription to cart" : "Medicine unavailable"}
                      </button>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="customer-section-title">
          <h4>Available Medicines</h4>
        </div>

        <div className="row g-4">
          {medicines.length === 0 ? (
            <div className="col-12">
              <div className="alert alert-info customer-empty">
                No approved medicines available right now.
              </div>
            </div>
          ) : (
            medicines.map((medicine) => (
              <div className="col-md-4 col-sm-6" key={medicine.id}>
                <div className="card customer-medicine-card h-100 shadow-sm border-0">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="badge bg-success">Approved</span>
                      <span className="stock-badge">{medicine.quantity} left</span>
                    </div>

                    <h5 className="card-title">{medicine.name}</h5>

                    <p className="text-muted customer-description">
                      {medicine.description}
                    </p>

                    <div className="price-row">
                      <h4>₹{medicine.price}</h4>
                      <span className="supplier-name">{medicine.supplierName || "Supplier"}</span>
                    </div>

                    <label className="form-label mt-3">Quantity to buy</label>

                    <input
                      type="number"
                      className="form-control mb-3"
                      min="1"
                      max={medicine.quantity}
                      value={quantities[medicine.id] || 1}
                      onChange={(e) =>
                        setQuantities({
                          ...quantities,
                          [medicine.id]: e.target.value,
                        })
                      }
                    />

                    <button
                      className="btn customer-buy-btn w-100"
                      onClick={() => addToCart(medicine, quantities[medicine.id] || 1)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <section className="customer-prescriptions customer-cart" aria-labelledby="cart-heading">
          <div className="customer-section-title">
            <div>
              <h4 id="cart-heading">Shopping Cart <span className="cart-count">{cart.reduce((total, item) => total + Number(item.quantity), 0)}</span></h4>
              <p>Review quantities before placing your order.</p>
            </div>
            {cart.length > 0 && (
              <strong className="cart-total">
                Total: ₹{cart.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0).toFixed(2)}
              </strong>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="customer-empty-box">Your cart is empty. Add a medicine to get started.</div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => {
                  const medicine = medicines.find((entry) => entry.id === item.medicineId);
                  const quantityInOtherLines = cart
                    .filter((entry) => entry.medicineId === item.medicineId && entry.id !== item.id)
                    .reduce((total, entry) => total + Number(entry.quantity), 0);
                  const maxQuantity = Math.max(1, Number(medicine?.quantity || 0) - quantityInOtherLines);

                  return (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-item-details">
                        <strong>{item.medicineName}</strong>
                        <span>{item.supplierName} · ₹{Number(item.price).toFixed(2)} each</span>
                        {item.prescriptionId && <small>Doctor prescription</small>}
                      </div>
                      <div className="cart-item-actions">
                        <label className="visually-hidden" htmlFor={`cart-quantity-${item.id}`}>Quantity for {item.medicineName}</label>
                        <input
                          id={`cart-quantity-${item.id}`}
                          className="form-control cart-quantity-input"
                          type="number"
                          min="1"
                          max={maxQuantity}
                          value={item.quantity}
                          onChange={(event) => updateCartQuantity(item.id, event.target.value)}
                        />
                        <strong className="cart-line-total">₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</strong>
                        <button
                          className="btn cart-remove-btn"
                          type="button"
                          aria-label={`Remove ${item.medicineName} from cart`}
                          onClick={() => removeCartItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="cart-footer">
                <span>{cart.length} {cart.length === 1 ? "item" : "items"}</span>
                <button className="btn customer-buy-btn" type="button" onClick={checkout}>
                  Place Order
                </button>
              </div>
            </>
          )}
        </section>

        <div className="customer-section-title mt-5">
          <h4>My Orders</h4>
        </div>

        {myOrders.length === 0 ? (
          <div className="customer-empty-box">You have not placed any orders yet.</div>
        ) : (
          <div className="table-responsive customer-order-table">
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Medicine</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Order Date</th>
                </tr>
              </thead>

              <tbody>
                {myOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.medicineName}</td>
                    <td>{order.quantity}</td>
                    <td>₹{order.total.toFixed(2)}</td>
                    <td>
                      <span className="badge bg-info text-dark">
                        {order.status}
                      </span>
                    </td>
                    <td>{order.orderDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}