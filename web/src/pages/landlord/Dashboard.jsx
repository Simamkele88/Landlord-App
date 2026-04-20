// DASHBOARD PAGE FOR LANDLORDS
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU DO NOT UNDERSTAND THIS CODE, PLEASE ASK ME TO EXPLAIN AND DON'T ASSUME OTHERWISE.
import { useAuth } from "../../App";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useDocumentTitle("Dashboard");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  

  return (
    <div className="dashboard">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <div className="auth-logo" style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
            <h1>Hello, {user?.name}!</h1>
            <p style={{ color: "#666", marginTop: 4 }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary">
            Sign Out
          </button>
        </div>

        <div className="dashboard-info">
          <p>✅ You are authenticated as a landlord big boss, hahaha maybe one day</p>
          
        </div>
      </div>
    </div>
  );
}
