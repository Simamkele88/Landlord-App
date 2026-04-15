import LandlordSidebar from "../pages/landlord/bars/LandlordSidebar";
import LandlordTopBar from "../pages/landlord/bars/TopBar";
import { Outlet } from "react-router-dom";

export default function LandlordLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <LandlordSidebar />

      {/* Right side */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <LandlordTopBar />

        {/* Changing content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
  <Outlet />
</main>
      </div>
    </div>
  );
}