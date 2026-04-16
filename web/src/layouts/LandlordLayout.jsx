// This layout is used for all landlord pages.
//  It includes the sidebar and top bar, and an <Outlet> for the changing content.
// Basically, it provides a consistent structure for all landlord pages, so we don't have to repeat the sidebar and top bar in every page component.
// More like a master layout for the landlord section of the app.
import LandlordSidebar from "../pages/landlord/bars/LandlordSidebar";
import LandlordTopBar from "../pages/landlord/bars/TopBar";
import { Outlet } from "react-router-dom";

export default function LandlordLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <LandlordSidebar />

      {/* Top bar */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <LandlordTopBar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
  <Outlet />
</main>
      </div>
    </div>
  );
}