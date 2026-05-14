// CARETAKER LAYOUT — WITH ROLE PROTECTION
import { Navigate } from "react-router-dom";
import { useAuth } from "../App";
import CaretakerSidebar from "../pages/caretaker/bars/CaretakerSidebar";
import CaretakerTopBar from "../pages/caretaker/bars/CaretakerTopBar.jsx";
import { Outlet } from "react-router-dom";

export default function CaretakerLayout() {
  const { user, token } = useAuth();


  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "landlord") {
    return <Navigate to="/landlord/dashboard" replace />;
  }


  if (user.role === "tenant") {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "caretaker") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <CaretakerSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <CaretakerTopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}