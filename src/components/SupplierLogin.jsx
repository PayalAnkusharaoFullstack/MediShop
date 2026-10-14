import { useState } from "react";

export default function SupplierLogin({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const suppliers = JSON.parse(localStorage.getItem("suppliers") || "[]");
    const cleanEmail = email.trim().toLowerCase();
    const supplier = suppliers.find(
      (item) => item.email === cleanEmail && item.password === password
    );

    if (!supplier) {
      alert("Invalid email or password. Please try again.");
      return;
    }

    onLogin(supplier);
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h3 className="text-center mb-4">Supplier Login</h3>

              <form onSubmit={handleSubmit}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button type="submit" className="btn btn-primary w-100">
                  Login
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                Need an account?{" "}
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={onShowRegister}
                >
                  Register here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
