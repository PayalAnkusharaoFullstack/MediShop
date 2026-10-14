import { useState } from "react";

export default function SupplierRegister({ onRegister, onShowLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const suppliers = JSON.parse(
      localStorage.getItem("suppliers") || "[]"
    );

    const cleanEmail = email.trim().toLowerCase();

    if (suppliers.some((s) => s.email === cleanEmail)) {
      alert("Email already registered. Please login.");
      return;
    }

    const supplier = {
      id: Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password,
    };

    const updatedSuppliers = [...suppliers, supplier];
    localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers));

    alert("Registration successful! Please login.");
    onShowLogin();
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h3 className="text-center mb-4">
                Supplier Registration
              </h3>

              <form onSubmit={handleSubmit}>
                <label className="form-label">Supplier Name</label>
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter supplier name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Create password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                >
                  Register
                </button>
              </form>

              <p className="text-center mt-3 mb-0">
                Already registered?{" "}
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={onShowLogin}
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
