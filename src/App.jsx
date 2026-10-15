import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SupplierDashboard from "./pages/SupplierDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import MRDashboard from "./pages/MRDashboard";
import Navbar from "./components/Navbar";

function RouteContent() {
  const location = useLocation();

  return (
    <main className="page-content">
      <div key={location.pathname} className="route-stage">
        <Routes>
          <Route path="/" element={<Navigate to="/supplier" />} />
          <Route path="/supplier" element={<SupplierDashboard />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/mr" element={<MRDashboard />} />
          <Route path="/customer" element={<CustomerDashboard />} />
        </Routes>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />

        <RouteContent />
      </div>
    </BrowserRouter>
  );
}

export default App;
