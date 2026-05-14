// LANDLORD LAYOUT — WITH ROLE PROTECTION
import { Navigate } from "react-router-dom";
import { useAuth } from "../App";
import LandlordSidebar from "../pages/landlord/bars/LandlordSidebar";
import LandlordTopBar from "../pages/landlord/bars/TopBar";
import { Outlet } from "react-router-dom";

export default function LandlordLayout() {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "caretaker") {
    return <Navigate to="/caretaker/dashboard" replace />;
  }

  if (user.role === "tenant") {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "landlord") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <LandlordSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <LandlordTopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}