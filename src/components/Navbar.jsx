import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg medi-navbar">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/supplier">
          <span className="medi-brand-mark" aria-hidden="true">+</span>
          MediShop
        </Link>

        <div className="navbar-nav ms-auto">
          <NavLink className="nav-link" to="/supplier">
            Supplier
          </NavLink>

          <NavLink className="nav-link" to="/doctor">
            Doctor
          </NavLink>

          <NavLink className="nav-link" to="/admin">
            Admin
          </NavLink>

          <NavLink className="nav-link" to="/customer">
            Customer
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
