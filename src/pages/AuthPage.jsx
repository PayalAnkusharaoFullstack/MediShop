import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const roles = [
  { value: "customer", label: "Customer", accountsKey: "customers", sessionKey: "loggedInCustomer", route: "/customer", canRegister: true },
  { value: "supplier", label: "Supplier", accountsKey: "suppliers", sessionKey: "loggedInSupplier", route: "/supplier", canRegister: true },
  { value: "doctor", label: "Doctor", accountsKey: "doctors", sessionKey: "loggedInDoctor", route: "/doctor", canRegister: true },
  { value: "mr", label: "Medical Representative", accountsKey: "medicalRepresentatives", sessionKey: "loggedInMR", route: "/mr", canRegister: true },
  { value: "admin", label: "Admin", accountsKey: "admins", sessionKey: "loggedInAdmin", route: "/admin", canRegister: false },
  { value: "super-admin", label: "Super Admin", accountsKey: "superAdmins", sessionKey: "loggedInSuperAdmin", route: "/super-admin", canRegister: false },
];

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = roles.some(({ value }) => value === searchParams.get("role"))
    ? searchParams.get("role")
    : "customer";
  const [role, setRole] = useState(initialRole);
  const [registerMode, setRegisterMode] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const selectedRole = roles.find((item) => item.value === role);
  const isSuperAdminSetup = role === "super-admin" && readArray(selectedRole.accountsKey).length === 0;
  const isRegistering = registerMode || isSuperAdminSetup;

  const handleRoleChange = (event) => {
    const nextRole = event.target.value;
    setRole(nextRole);
    setRegisterMode(false);
    setError("");
  };

  const startSession = (account) => {
    const session = role === "admin" || role === "super-admin"
      ? { id: account.id, name: account.name, email: account.email }
      : account;

    try {
      localStorage.setItem(selectedRole.sessionKey, JSON.stringify(session));
    } catch {
      setError("Your account was saved, but we could not sign you in. Please try signing in again.");
      return;
    }

    navigate(selectedRole.route, { replace: true });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const accounts = readArray(selectedRole.accountsKey);

    if (isRegistering) {
      const existingAccount = accounts.find((account) => account.email?.toLowerCase() === email);
      if (existingAccount) {
        if (existingAccount.password === form.password) {
          startSession(existingAccount);
          return;
        }

        setError("An account with this email already exists for the selected role.");
        return;
      }

      const account = {
        id: Date.now(),
        name: form.name.trim(),
        email,
        password: form.password,
      };
      try {
        localStorage.setItem(selectedRole.accountsKey, JSON.stringify([...accounts, account]));
      } catch {
        setError("We could not save your account. Please check your browser storage and try again.");
        return;
      }

      startSession(account);
      return;
    }

    const account = accounts.find((item) =>
      item.email?.toLowerCase() === email && item.password === form.password
    );
    if (!account) {
      setError("Email or password is incorrect for the selected role.");
      return;
    }

    startSession(account);
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <aside className="auth-visual" aria-label="MediShop services">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true">+</span>
            <span>MediShop</span>
          </div>
          <div className="auth-visual-copy">
            <span className="auth-visual-tag">CARE, CONNECTED</span>
            <h2>Better care starts with the right connection.</h2>
            <p>One account brings your healthcare journey together—from trusted products to expert care.</p>
          </div>
          <div className="auth-orbit" aria-hidden="true">
            <span className="auth-orbit-ring" />
            <span className="auth-orbit-plus">+</span>
            <span className="auth-orbit-dot auth-orbit-dot-one" />
            <span className="auth-orbit-dot auth-orbit-dot-two" />
          </div>
          <div className="auth-visual-footer">
            <span className="auth-status-dot" />
            <span>A simpler way to manage care</span>
          </div>
        </aside>

        <div className="auth-content">
          <div className="auth-heading">
            <p className="dashboard-kicker">{isRegistering ? "JOIN MEDISHOP" : "YOUR MEDISHOP ACCOUNT"}</p>
            <h1 id="auth-title">
              {isSuperAdminSetup ? "Set up Super Admin" : isRegistering ? "Create your account" : "Welcome back"}
            </h1>
            <p className="auth-intro">Sign in or create an account to continue.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-label" htmlFor="auth-role">Choose your role</label>
            <select id="auth-role" className="form-select mb-3" value={role} onChange={handleRoleChange}>
              {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>

            {isRegistering && (
              <>
                <label className="form-label" htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  className="form-control mb-3"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  autoComplete="name"
                  required
                />
              </>
            )}

            <label className="form-label" htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              className="form-control mb-3"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              autoComplete="email"
              required
            />

            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-control mb-3"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              minLength={isRegistering ? 6 : undefined}
              required
            />

            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="btn customer-buy-btn w-100 auth-submit" type="submit">
              <span>{isSuperAdminSetup ? "Create Super Admin account" : isRegistering ? "Create account" : "Sign in as"} {isSuperAdminSetup ? "" : selectedRole.label}</span>
              <span className="auth-submit-arrow" aria-hidden="true">→</span>
            </button>
          </form>

          {selectedRole.canRegister && role !== "super-admin" && (
            <button
              className="btn btn-link customer-auth-toggle"
              type="button"
              onClick={() => {
                setRegisterMode(!registerMode);
                setError("");
              }}
            >
              {registerMode ? "Already registered? Sign in" : "New to MediShop? Create an account"}
            </button>
          )}
          {role === "admin" && (
            <p className="auth-admin-note">Admin accounts are provisioned by a super admin.</p>
          )}
          {isSuperAdminSetup && (
            <p className="auth-admin-note">Create the first Super Admin account for this browser.</p>
          )}
          <p className="auth-secure-note"><span aria-hidden="true">✓</span> Your account, your care, all in one place</p>
        </div>
      </section>
    </main>
  );
}
