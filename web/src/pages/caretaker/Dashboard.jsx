// CARETAKER DASHBOARD PAGE
import { useNavigate } from "react-router-dom";
import { Wrench, AlertCircle, CheckCircle, Clock, Building2, Users, Flag, ArrowRight } from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";


const RECENT_MAINTENANCE = [
  { id: 1, title: "Burst pipe under kitchen sink", unit: "Unit 4A", tenant: "Sipho Dlamini", priority: "Urgent", status: "In Progress", reportedOn: "2026-04-18" },
  { id: 2, title: "Broken bedroom window latch", unit: "Unit 2B", tenant: "Lerato Mokoena", priority: "Medium", status: "Needs Repair", reportedOn: "2026-04-15" },
  { id: 3, title: "Cracked ceiling in lounge", unit: "Unit 3A", tenant: "Nomsa Khumalo", priority: "High", status: "Needs Repair", reportedOn: "2026-04-12" },
  { id: 4, title: "Damp patch on bedroom wall", unit: "Unit 6B", tenant: "Kabelo Sithole", priority: "High", status: "Needs Repair", reportedOn: "2026-04-10" },
];

export default function CaretakerDashboard() {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of all properties and tasks</p>
        </div>


        {/* RECENT MAINTENANCE */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Maintenance Requests</h2>
            <button onClick={() => navigate("/caretaker/maintenance")} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {RECENT_MAINTENANCE.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.tenant} · {item.unit} · {item.reportedOn}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    item.priority === "Urgent" ? "bg-red-500 text-white" : 
                    item.priority === "High" ? "bg-orange-400 text-white" : "bg-yellow-400 text-gray-900"
                  }`}>{item.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    item.status === "Needs Repair" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  }`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}