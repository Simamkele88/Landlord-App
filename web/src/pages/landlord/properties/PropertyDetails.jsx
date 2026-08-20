/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "../../../contexts/ToastContext";
import {
    FiGrid, FiFileText, FiBarChart2,
    FiChevronRight, FiChevronDown, FiExternalLink, FiArrowUp,
    FiTruck, FiShield, FiDroplet, FiHome, FiLayers, FiMaximize,
    FiUser, FiEdit, FiPlus, FiEye, FiX,
    FiDownload, FiUsers, FiTool, FiShoppingCart, FiSearch,
    FiRefreshCw, FiSave, FiAlertTriangle, FiTrash2
} from "react-icons/fi";
import { FaInfoCircle, FaPlus, FaTrashAlt, FaShoppingCart, FaHome } from "react-icons/fa";
import { IoMdCash, IoIosStats } from "react-icons/io";
import { RiCommunityFill } from "react-icons/ri";
import { MdEditDocument } from "react-icons/md";
import { c as COLORS } from "../../../styles/theme";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';
const DEFAULT_CENTER = [-26.2041, 28.0473];
const PROVINCES = [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
    "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];
const PROPERTY_TYPES = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "industrial", label: "Industrial" },
    { value: "mixed_use", label: "Mixed Use" },
];

const softMarkerIcon = L.divIcon({
    className: "",
    html: `
    <div style="
      width: 24px; height: 24px;
      background: #3498db;
      border: 3px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    "></div>
  `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -20],
});

const TABS = [
    { id: "property", label: "Property", icon: FaInfoCircle },
    { id: "units", label: "Units", icon: RiCommunityFill },
    { id: "financials", label: "Financials", icon: IoMdCash },
    { id: "leases", label: "Leases", icon: MdEditDocument },
    { id: "reports", label: "Reports", icon: IoIosStats },
];

function formatAmount(amount) {
    return amount === null || amount === undefined || amount === ""
        ? "—"
        : `R ${Number(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function InfoRow({ label, children, compact }) {
    const labelWidth = compact ? "110px" : "150px";
    return (
        <div style={{
            display: 'flex',
            overflow: 'hidden',
            border: '1px solid #e2e3e4',
            marginBottom: '0.4rem',
            fontSize: '14px',
            fontWeight: 400,
            flex: compact ? 1 : undefined,
        }}>
            <div style={{
                width: labelWidth,
                flexShrink: 0,
                padding: '0.4rem 0.6rem',
                color: '#000',
                fontWeight: 500,
                background: '#fdfdfd',
                borderRight: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
            }}>
                {label}
            </div>
            <div style={{
                padding: '0.4rem 0.6rem',
                color: '#000',
                background: '#f5f5f5',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 400,
            }}>
                {children}
            </div>
        </div>
    );
}

function OutlineButton({ icon: Icon, children, onClick, style }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                background: "#fdfdfd", color: "#000",
                border: "1px solid #ccc", borderRadius: "2px",
                padding: "0.3rem 0.6rem", fontSize: "14px", fontWeight: 400,
                cursor: "pointer", fontFamily: FONT, ...style,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f4f5f6")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fdfdfd")}
        >
            {Icon && <Icon size={14} />} {children}
        </button>
    );
}

const thStyle = {
    padding: '0.6rem 0.8rem',
    fontSize: '12px',
    fontWeight: 600,
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    background: '#e9eced52',
    border: '1px solid #9a9d9e52',
    textAlign: 'left',
    whiteSpace: 'nowrap',
};

const tdStyle = {
    padding: '0.6rem 0.8rem',
    fontSize: '12px',
    color: '#151515',
    border: '1px solid #9a9d9e52',
    verticalAlign: 'middle',
    fontWeight: 400,
    background: '#e9eced52',
};

const STATUS_MAP = {
    "All": "All",
    "Occupied": "occupied",
    "Vacant": "vacant",
    "Maintenance": "maintenance",
};

const statusConfig = {
    "occupied": { color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Occupied" },
    "vacant": { color: "#2c6b9b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Vacant" },
    "maintenance": { color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Maintenance" },
    "reserved": { color: "#54326b", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", label: "Reserved" },
};

function StatusBadge({ status }) {
    const cfg = statusConfig[status] ?? statusConfig["vacant"];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.6rem',
            borderRadius: '12px', color: cfg.color, background: cfg.bg, border: cfg.border,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
            {cfg.label}
        </span>
    );
}

export default function PropertySummaryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [property, setProperty] = useState(null);
    const [leases, setLeases] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("property");
    const [financialPeriod, setFinancialPeriod] = useState("ytd");
    const [leaseSearch, setLeaseSearch] = useState("");
    const [leaseFilter, setLeaseFilter] = useState("all");

    const [unitSearch, setUnitSearch] = useState("");
    const [unitStatusFilter, setUnitStatusFilter] = useState("All");
    const [unitPageSize, setUnitPageSize] = useState(10);
    const [unitPage, setUnitPage] = useState(1);

    const [editMode, setEditMode] = useState(false);
    const [propertyForm, setPropertyForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleteNotice, setDeleteNotice] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [caretakers, setCaretakers] = useState([]);

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const fetchProperty = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`${API}/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperty(data.property || data);
            setUnits(data.property?.units || data.units || []);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load property");
            toast.error("Failed to load property.");
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    const fetchLeases = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`${API}/properties/${id}/leases`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeases(data.leases || []);
            setLeaseFilter("all");
        } catch (err) {
            toast.error("Failed to load leases.");
        }
    }, [id, toast]);

    const fetchCaretakers = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(`${API}/landlord/caretakers/not-assigned`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCaretakers(data.caretakers || data || []);
        } catch (err) {
            /*Hi*/
        }
    }, []);

    useEffect(() => {
        fetchProperty();
        fetchLeases();
    }, [fetchProperty, fetchLeases]);

    useEffect(() => {
        if (editMode && mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, 12);
            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: "abcd",
                maxZoom: 20,
                minZoom: 3,
            }).addTo(map);
            map.on("click", (e) => {
                placeMarker(e.latlng.lat, e.latlng.lng);
            });
            mapRef.current = map;

            if (property?.latitude != null && property?.longitude != null) {
                const lat = Number(property.latitude);
                const lng = Number(property.longitude);
                map.setView([lat, lng], 16);
                markerRef.current = L.marker([lat, lng], {
                    icon: softMarkerIcon,
                    draggable: true,
                }).addTo(map);
                markerRef.current.on("dragend", () => {
                    const pos = markerRef.current.getLatLng();
                    setPropertyForm(prev => ({
                        ...prev,
                        latitude: Number(pos.lat.toFixed(7)),
                        longitude: Number(pos.lng.toFixed(7)),
                    }));
                });
            }

            return () => {
                map.remove();
                mapRef.current = null;
                markerRef.current = null;
            };
        }
    }, [editMode, property]);

    function placeMarker(lat, lng) {
        setPropertyForm(prev => ({
            ...prev,
            latitude: Number(lat.toFixed(7)),
            longitude: Number(lng.toFixed(7)),
        }));
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else if (mapRef.current) {
            markerRef.current = L.marker([lat, lng], {
                icon: softMarkerIcon,
                draggable: true,
            }).addTo(mapRef.current);
            markerRef.current.on("dragend", () => {
                const pos = markerRef.current.getLatLng();
                setPropertyForm(prev => ({
                    ...prev,
                    latitude: Number(pos.lat.toFixed(7)),
                    longitude: Number(pos.lng.toFixed(7)),
                }));
            });
        }
    }

    const runSearch = useCallback(async (q) => {
        if (!q || q.trim().length < 3) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: { format: "json", q, countrycodes: "za", limit: 5 },
            });
            setSearchResults(data || []);
        } catch (err) {
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => runSearch(searchQuery), 400);
        return () => clearTimeout(t);
    }, [searchQuery, runSearch]);

    function goToSearchResult(result) {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        if (mapRef.current) mapRef.current.setView([lat, lng], 16);
        setSearchResults([]);
        setSearchQuery(result.display_name);
        placeMarker(lat, lng);
    }

    function startEdit() {
        setPropertyForm({
            name: property.name || "",
            property_type: property.property_type || "residential",
            address_line1: property.address_line1 || "",
            address_line2: property.address_line2 || "",
            city: property.city || "",
            province: property.province || "",
            postal_code: property.postal_code || "",
            country: property.country || "South Africa",
            caretaker_id: property.caretaker_id || "",
            year_built: property.year_built ?? "",
            total_floors: property.total_floors ?? "",
            total_units: property.total_units ?? "",
            has_elevator: property.has_elevator || false,
            has_parking: property.has_parking || false,
            parking_spots: property.parking_spots ?? "",
            has_security: property.has_security || false,
            has_pool: property.has_pool || false,
            pet_friendly: property.pet_friendly || false,
            monthly_rates: property.monthly_rates ?? "",
            monthly_levies: property.monthly_levies ?? "",
            latitude: property.latitude ?? null,
            longitude: property.longitude ?? null,
        });
        setEditMode(true);
        fetchCaretakers();
        setDeleteNotice("");
    }

    async function saveEdit() {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                name: propertyForm.name.trim(),
                property_type: propertyForm.property_type,
                address_line1: propertyForm.address_line1.trim(),
                address_line2: propertyForm.address_line2.trim() || null,
                city: propertyForm.city.trim(),
                province: propertyForm.province || null,
                postal_code: propertyForm.postal_code || null,
                country: propertyForm.country || "South Africa",
                caretaker_id: propertyForm.caretaker_id || null,
                year_built: propertyForm.year_built ? Number(propertyForm.year_built) : null,
                total_floors: propertyForm.total_floors ? Number(propertyForm.total_floors) : null,
                total_units: propertyForm.total_units ? Number(propertyForm.total_units) : null,
                has_elevator: propertyForm.has_elevator,
                has_parking: propertyForm.has_parking,
                parking_spots: propertyForm.has_parking && propertyForm.parking_spots ? Number(propertyForm.parking_spots) : null,
                has_security: propertyForm.has_security,
                has_pool: propertyForm.has_pool,
                pet_friendly: propertyForm.pet_friendly,
                monthly_rates: propertyForm.monthly_rates ? Number(propertyForm.monthly_rates) : null,
                monthly_levies: propertyForm.monthly_levies ? Number(propertyForm.monthly_levies) : null,
                latitude: propertyForm.latitude != null ? Number(propertyForm.latitude) : null,
                longitude: propertyForm.longitude != null ? Number(propertyForm.longitude) : null,
            };
            await axios.put(`${API}/properties/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Property updated!");
            setEditMode(false);
            fetchProperty();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update property.");
        } finally {
            setSaving(false);
        }
    }

    const canDelete = !units.some(u => u.status === 'occupied') && !leases.some(l => l.status === 'active');

    function handleDeleteClick() {
        if (!canDelete) {
            setDeleteNotice("This property cannot be deleted because it has active leases or occupied units.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
            confirmDelete();
        }
    }

    async function confirmDelete() {
        setDeleting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API}/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Property deleted.");
            navigate("/landlord/properties");
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to delete property.");
            setDeleteNotice("");
        } finally {
            setDeleting(false);
        }
    }

    const totalOccupied = units.filter(u => u.status === 'occupied').length;
    const isOccupied = totalOccupied > 0;
    const occupancyRate = units.length > 0 ? Math.round((totalOccupied / units.length) * 100) : 0;

    const statusColors = {
        vacant: '#27ae60',
        occupied: '#e74c3c',
        maintenance: '#f39c12',
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                padding: '4rem 2rem', color: '#95a5a6', fontWeight: 400,
                background: '#fdfdfd', border: '1px solid #e9ecef',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)', fontFamily: FONT,
            }}>
                <span style={{
                    width: 22, height: 22, border: '2px solid rgba(44,62,80,0.1)',
                    borderTopColor: '#2c3e50', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite', display: 'inline-block',
                }} />
                <span style={{ fontSize: '14px' }}>Loading property...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div style={{
                padding: '3rem 2rem', textAlign: 'center', fontWeight: 400,
                background: '#fdfdfd', border: '1px solid #e9ecef',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)', fontFamily: FONT,
            }}>
                <p style={{ fontSize: '14px', color: '#c0392b', marginBottom: '0.8rem' }}>{error || "Property not found"}</p>
                <button onClick={fetchProperty} style={{
                    background: 'transparent', color: '#2471a3', border: 'none',
                    cursor: 'pointer', fontSize: '14px', textDecoration: 'underline',
                }}>
                    Try again
                </button>
            </div>
        );
    }

    const {
        name, property_type, address_line1, address_line2, city, province,
        postal_code, country, total_floors, total_units, has_elevator,
        has_parking, parking_spots, has_security, has_pool, pet_friendly,
        monthly_rates, monthly_levies, caretaker_name,
        latitude, longitude,
    } = property;

    const fullAddress = [address_line1, address_line2, city, province, postal_code, country].filter(Boolean).join(', ');
    const propertyTypeDisplay = property_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const hasCoords = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);
    const mapLat = hasCoords ? parseFloat(latitude) : DEFAULT_CENTER[0];
    const mapLng = hasCoords ? parseFloat(longitude) : DEFAULT_CENTER[1];
    const mapLabel = hasCoords ? `${mapLat.toFixed(6)}, ${mapLng.toFixed(6)}` : "Default location";

    const googleMapsFallback = `https://maps.google.com/maps?q=${mapLat},${mapLng}&z=16&output=embed`;

    const monthlyRentalIncome = units.reduce((sum, u) => sum + (parseFloat(u.monthly_rent) || 0), 0);
    const totalDeposits = units.reduce((sum, u) => sum + (parseFloat(u.deposit_amount) || 0), 0);
    const monthlyExpenses = (parseFloat(monthly_rates) || 0) + (parseFloat(monthly_levies) || 0);

    const filteredUnits = units.filter(u => {
        const actualStatus = STATUS_MAP[unitStatusFilter];
        const matchStatus = actualStatus === "All" || u.status === actualStatus;
        const q = unitSearch.toLowerCase();
        const matchSearch = !q || [
            String(u.unit_number),
            u.unit_type,
            u.tenant_name ?? "",
        ].some(s => (s || "").toLowerCase().includes(q));
        return matchStatus && matchSearch;
    });
    const totalUnitPages = Math.max(1, Math.ceil(filteredUnits.length / unitPageSize));
    const currentUnitPage = Math.min(unitPage, totalUnitPages);
    const unitStartIndex = (currentUnitPage - 1) * unitPageSize;
    const paginatedUnits = filteredUnits.slice(unitStartIndex, unitStartIndex + unitPageSize);

    const filteredLeases = leases
        .filter(lease => {
            if (leaseFilter === "all") return true;
            if (leaseFilter === "active") return lease.status === "active";
            if (leaseFilter === "ended") return lease.status === "terminated" || lease.status === "cancelled";
            return false;
        })
        .filter(lease =>
            !leaseSearch ||
            (lease.tenant_name || "").toLowerCase().includes(leaseSearch.toLowerCase()) ||
            (name || "").toLowerCase().includes(leaseSearch.toLowerCase())
        );

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); 
    const periodColumns = financialPeriod === "ytd"
        ? ["YTD"]
        : financialPeriod === "lastYear"
            ? ["Last Year"]
            : financialPeriod === "last3Months"
                ? [
                    new Date(currentYear, currentMonth - 2, 1).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }),
                    new Date(currentYear, currentMonth - 1, 1).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }),
                    new Date(currentYear, currentMonth, 1).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }),
                ]
                : [currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4].map(y => String(y));

    return (
        <div style={{ fontSize: '14px', fontWeight: 400, fontFamily: FONT, color: '#000' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
                .rb-link:hover { text-decoration: underline; }
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table tbody tr:hover { background: #fafbfc; }
                .action-btn {
                    display: inline-flex; align-items: center; justify-content: center;
                    width: 28px; height: 28px; cursor: pointer;
                    border: 1px solid #dee2e6; background: #fdfdfd; color: #000;
                    transition: all 0.15s;
                }
                .action-btn:hover { background: #f4f5f6; color: #000; }
                .action-btn.danger:hover { background: #fdf0f0; color: #e74c3c; border-color: #f5c6cb; }
                .rb-select {
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    padding-right: 1.8rem;
                }
                .leaflet-container { font-family: inherit; }
            `}</style>

            {/* Breadcrumb */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
                fontSize: '14px', fontWeight: 400, color: '#333', padding: '0.55rem 0.8rem',
                background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
            }}>
                <FiChevronRight size={13} style={{ color: '#555' }} />
                <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
                <span style={{ color: '#555' }}>/</span>
                <Link to="/landlord/properties" className="rb-link">Properties</Link>
                <span style={{ color: '#555' }}>/</span>
                <span style={{ color: '#000' }}>{name || 'Property'}</span>
            </div>

            {/* Main card */}
            <div style={{
                background: '#fefcfccf', border: '1px solid #e9ecef',
                boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)', overflow: 'hidden',
            }}>
                {/* Tabs */}
                <div style={{
                    display: 'flex', alignItems: 'flex-end', background: '#eee',
                    boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.1)',
                }}>
                    {TABS.map(tab => {
                        const active = activeTab === tab.id;
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem',
                                    fontSize: '14px', fontWeight: active ? 500 : 400,
                                    color: active ? '#000' : '#333',
                                    background: active ? '#fdfdfd' : 'transparent',
                                    border: active ? '1px solid #e9ecef' : '1px solid transparent',
                                    borderBottom: active ? '1px solid #fdfdfd' : 'none',
                                    borderTop: active ? '2px solid #3498db' : '2px solid transparent',
                                    cursor: 'pointer', marginBottom: active ? '-1px' : '0',
                                    position: 'relative', zIndex: active ? 2 : 1,
                                    transition: 'background 0.15s, border-color 0.15s',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <TabIcon size={14} />
                                {tab.label}
                                {tab.id === 'units' && units.length > 0 && (
                                    <span style={{
                                        background: active ? '#eaf2f8' : 'rgba(0,0,0,0.1)',
                                        color: active ? '#2471a3' : '#333',
                                        padding: '0.1rem 0.4rem', fontSize: '11px', fontWeight: 500,
                                    }}>
                                        {units.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div style={{ border: '1px solid #e9ecefbe', minHeight: '300px', margin: '0.8rem 0.6rem 1.6rem ', boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.2)', borderRadius: '2px' }}>

                    {/* PROPERTY TAB */}
                    {activeTab === "property" && (
                        <div style={{ padding: '1.2rem' }}>
                            {deleteNotice && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.6rem 0.9rem', marginBottom: '0.8rem',
                                    background: '#fbeaea', border: '1px solid #e5bdbd',
                                    borderRadius: '2px', color: '#9e3a3a', fontSize: '13px',
                                }}>
                                    <FiAlertTriangle size={14} />
                                    {deleteNotice}
                                    <button onClick={() => setDeleteNotice("")} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9e3a3a' }}>
                                        <FiX size={14} />
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                {/* Map container or iframe */}
                                {editMode ? (
                                    <div style={{ flex: '1 1 400px', minWidth: 280 }}>
                                        <div style={{ position: "relative", marginBottom: "0.6rem" }}>
                                            <FiSearch size={15} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#95a5a6", zIndex: 500 }} />
                                            <input
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Search address..."
                                                style={{ width: '100%', padding: '0.55rem 0.8rem 0.55rem 2.2rem', fontSize: '15px', border: '1px solid #dee2e6', borderRadius: '2px', color: '#2c3e50', background: '#fdfdfd', outline: 'none' }}
                                            />
                                            {searchResults.length > 0 && (
                                                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fdfdfd", border: "1px solid #dee2e6", zIndex: 500, maxHeight: 220, overflowY: "auto" }}>
                                                    {searchResults.map((r, i) => (
                                                        <button key={i} type="button" onClick={() => goToSearchResult(r)}
                                                            style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.8rem", fontSize: "13.5px", background: "transparent", border: "none", borderBottom: "1px solid #f1f3f5", cursor: "pointer", color: "#2c3e50" }}>
                                                            {r.display_name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div ref={mapContainerRef} style={{ height: 400, border: "1px solid #dee2e6", borderRadius: "2px" }} />
                                        <div style={{ marginTop: "0.5rem", fontSize: "14px" }}>
                                            Location:{" "}
                                            {propertyForm.latitude != null ? (
                                                <span style={{ color: "#2c3e50" }}>{propertyForm.latitude}, {propertyForm.longitude}</span>
                                            ) : (
                                                <span style={{ color: "#c0392b" }}>Please click on the map to set a location.</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        flex: '1 1 400px', minWidth: 280, aspectRatio: '16 / 10', maxHeight: 360,
                                        overflow: 'hidden', border: '1px solid #e9ecef', background: '#f9fafb', position: 'relative',
                                    }}>
                                        <iframe title="Property location" style={{ width: '100%', height: '100%', border: 'none' }}
                                            src={googleMapsFallback} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                                        <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(255,255,255,0.95)', padding: '0.25rem 0.55rem', fontSize: '12px', color: '#7f8c8d', border: '1px solid #e9ecef' }}>
                                            {mapLabel}
                                        </div>
                                        <a href={`https://www.google.com/maps?q=${mapLat},${mapLng}`} target="_blank" rel="noopener noreferrer"
                                            style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: '#fdfdfd', padding: '0.3rem 0.6rem', fontSize: '13px', color: '#2471a3', textDecoration: 'none', border: '1px solid #e9ecef', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <FiExternalLink size={11} /> Google Maps
                                        </a>
                                    </div>
                                )}

                                {/* Form or Info */}
                                <div style={{ flex: '1 1 400px', minWidth: 280 }}>
                                    {editMode ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Display name</label>
                                                    <input type="text" value={propertyForm.name} onChange={e => setPropertyForm(prev => ({ ...prev, name: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Property type</label>
                                                    <select value={propertyForm.property_type} onChange={e => setPropertyForm(prev => ({ ...prev, property_type: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}>
                                                        {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Address line 1</label>
                                                <input type="text" value={propertyForm.address_line1} onChange={e => setPropertyForm(prev => ({ ...prev, address_line1: e.target.value }))}
                                                    style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Address line 2</label>
                                                <input type="text" value={propertyForm.address_line2} onChange={e => setPropertyForm(prev => ({ ...prev, address_line2: e.target.value }))}
                                                    style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>City</label>
                                                    <input type="text" value={propertyForm.city} onChange={e => setPropertyForm(prev => ({ ...prev, city: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Province</label>
                                                    <select value={propertyForm.province} onChange={e => setPropertyForm(prev => ({ ...prev, province: e.target.value }))}
                                                        className="rb-select" style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}>
                                                        <option value="">Select province</option>
                                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Postal code</label>
                                                    <input type="text" value={propertyForm.postal_code} onChange={e => setPropertyForm(prev => ({ ...prev, postal_code: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Caretaker</label>
                                                    <select value={propertyForm.caretaker_id} onChange={e => setPropertyForm(prev => ({ ...prev, caretaker_id: e.target.value }))}
                                                        className="rb-select" style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}>
                                                        <option value="">Assign later</option>
                                                        {caretakers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Total floors</label>
                                                    <input type="number" value={propertyForm.total_floors} onChange={e => setPropertyForm(prev => ({ ...prev, total_floors: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Total units</label>
                                                    <input type="number" value={propertyForm.total_units} onChange={e => setPropertyForm(prev => ({ ...prev, total_units: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Amenities</label>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                                                        <input type="checkbox" checked={propertyForm.has_elevator} onChange={e => setPropertyForm(prev => ({ ...prev, has_elevator: e.target.checked }))} /> Elevator
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                                                        <input type="checkbox" checked={propertyForm.has_parking} onChange={e => setPropertyForm(prev => ({ ...prev, has_parking: e.target.checked }))} /> Parking
                                                    </label>
                                                    {propertyForm.has_parking && (
                                                        <input type="number" placeholder="Spots" value={propertyForm.parking_spots} onChange={e => setPropertyForm(prev => ({ ...prev, parking_spots: e.target.value }))}
                                                            style={{ width: '80px', padding: '0.3rem 0.5rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                    )}
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                                                        <input type="checkbox" checked={propertyForm.has_security} onChange={e => setPropertyForm(prev => ({ ...prev, has_security: e.target.checked }))} /> Security
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                                                        <input type="checkbox" checked={propertyForm.has_pool} onChange={e => setPropertyForm(prev => ({ ...prev, has_pool: e.target.checked }))} /> Pool
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                                                        <input type="checkbox" checked={propertyForm.pet_friendly} onChange={e => setPropertyForm(prev => ({ ...prev, pet_friendly: e.target.checked }))} /> Pet Friendly
                                                    </label>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Rates (R)</label>
                                                    <input type="number" value={propertyForm.monthly_rates} onChange={e => setPropertyForm(prev => ({ ...prev, monthly_rates: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Levies (R)</label>
                                                    <input type="number" value={propertyForm.monthly_levies} onChange={e => setPropertyForm(prev => ({ ...prev, monthly_levies: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                            </div>

                                            {/* Coordinates */}
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Latitude</label>
                                                    <input type="number" step="any" value={propertyForm.latitude ?? ""} onChange={e => setPropertyForm(prev => ({ ...prev, latitude: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Longitude</label>
                                                    <input type="number" step="any" value={propertyForm.longitude ?? ""} onChange={e => setPropertyForm(prev => ({ ...prev, longitude: e.target.value }))}
                                                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                                                <button onClick={() => { setEditMode(false); setDeleteNotice(""); }} disabled={saving}
                                                    style={{ background: '#fdfdfd', color: '#000', border: '1px solid #ccc', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '14px' }}>
                                                    Cancel
                                                </button>
                                                <button onClick={saveEdit} disabled={saving}
                                                    style={{ background: '#2c3e50', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {saving ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <FiSave size={14} />}
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <InfoRow label="Property Name" compact>{name || "—"}</InfoRow>
                                                <InfoRow label="Type" compact>{propertyTypeDisplay || "—"}</InfoRow>
                                            </div>
                                            <InfoRow label="Address">{fullAddress || "—"}</InfoRow>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <InfoRow label="Caretaker" compact>{caretaker_name || "—"}</InfoRow>
                                                <InfoRow label="Total Units" compact>{total_units || units.length || "—"}</InfoRow>
                                            </div>
                                            <InfoRow label="Floors">{total_floors || "—"}</InfoRow>
                                            <InfoRow label="Amenities">
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                    {has_elevator && <span style={{ padding: '0.15rem 0.4rem', fontSize: '13px', background: '#eaf2f8', color: '#2471a3', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FiArrowUp size={11} /> Elevator</span>}
                                                    {has_parking && <span style={{ padding: '0.15rem 0.4rem', fontSize: '13px', background: '#eaf2f8', color: '#2471a3', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FiTruck size={11} /> Parking{parking_spots ? ` (${parking_spots})` : ''}</span>}
                                                    {has_security && <span style={{ padding: '0.15rem 0.4rem', fontSize: '13px', background: '#eaf2f8', color: '#2471a3', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FiShield size={11} /> Security</span>}
                                                    {has_pool && <span style={{ padding: '0.15rem 0.4rem', fontSize: '13px', background: '#eaf2f8', color: '#2471a3', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FiDroplet size={11} /> Pool</span>}
                                                    {pet_friendly && <span style={{ padding: '0.15rem 0.4rem', fontSize: '13px', background: '#e8f8f5', color: '#1abc9c', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>🐾 Pet Friendly</span>}
                                                    {!has_elevator && !has_parking && !has_security && !has_pool && !pet_friendly && "—"}
                                                </div>
                                            </InfoRow>
                                            {(monthly_rates != null || monthly_levies != null) && (
                                                <InfoRow label="Monthly Costs">
                                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '14px' }}>
                                                        {monthly_rates != null && <span><span style={{ color: '#555' }}>Rates </span>{formatAmount(monthly_rates)}</span>}
                                                        {monthly_levies != null && <span><span style={{ color: '#555' }}>Levies </span>{formatAmount(monthly_levies)}</span>}
                                                    </div>
                                                </InfoRow>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button onClick={handleDeleteClick} disabled={deleting}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fdfdfd', color: '#000', border: '1px solid #ccc', padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400, cursor: 'pointer', borderRadius: '2px' }}>
                                                    <FiTrash2 size={14} /> Delete property
                                                </button>
                                                <button onClick={startEdit}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fdfdfd', color: '#000', border: '1px solid #ccc', padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400, cursor: 'pointer', borderRadius: '2px' }}>
                                                    <FiEdit size={14} /> Edit Property
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Status cards */}
                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
                                <div style={{ flex: 1, minWidth: 220, border: '1px solid #ccc', borderRadius: '3px', overflow: 'hidden', boxShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                        padding: '0.6rem 1rem', background: isOccupied ? '#53a93f' : '#fdfdfd',
                                        color: isOccupied ? '#ffffff' : '#000', borderBottom: isOccupied ? 'none' : '2px solid #3498db',
                                        fontSize: '16px', fontWeight: 500,
                                    }}>
                                        <FaHome size={15} /> {isOccupied ? 'Occupied' : 'Vacant'}
                                    </div>
                                    <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '14px', color: '#000' }}>
                                        {isOccupied ? `${totalOccupied} of ${units.length || 1} unit${units.length === 1 ? "" : "s"} occupied` : "No active tenants"}
                                        <div style={{ fontSize: '12px', marginTop: '0.3rem' }}>
                                            <a href="#leases" onClick={(e) => { e.preventDefault(); setActiveTab("leases"); }} style={{ color: '#2471a3', fontWeight: 400 }}>View leases</a>
                                            <span style={{ color: '#555' }}> &nbsp;|&nbsp; </span>
                                            <a href="#edit" onClick={(e) => e.preventDefault()} style={{ color: '#2471a3', fontWeight: 400 }}>Make inactive</a>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ flex: 1, minWidth: 220, border: '1px solid #ccc', borderRadius: '3px', overflow: 'hidden', boxShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem 1rem', color: '#000', borderBottom: '2px solid #3498db', fontSize: '16px', fontWeight: 500 }}>
                                        <IoMdCash size={15} /> Rental
                                    </div>
                                    <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '14px', color: '#000' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '0.2rem' }}>No rent outstanding</div>
                                        <div>Rental: {formatAmount(monthlyRentalIncome)}</div>
                                        <div>Deposit held: {formatAmount(totalDeposits)}</div>
                                    </div>
                                </div>

                                <div style={{ flex: 1, minWidth: 220, border: '1px solid #ccc', borderRadius: '3px', overflow: 'hidden', boxShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem 1rem', color: '#000', borderBottom: '2px solid #3498db', fontSize: '16px', fontWeight: 500 }}>
                                        <FaShoppingCart size={15} /> Expenses
                                    </div>
                                    <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '14px', color: '#000' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '0.2rem' }}>{monthlyExpenses > 0 ? `${formatAmount(monthlyExpenses)} due` : 'No unpaid bills'}</div>
                                        <div>Rates: {formatAmount(monthly_rates)}</div>
                                        <div>Levies: {formatAmount(monthly_levies)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UNITS TAB */}
                    {activeTab === "units" && (
                        <div style={{ padding: '1.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 500, margin: 0, color: '#000' }}>Units ({units.length})</h3>
                                <button onClick={() => navigate(`/landlord/properties/${id}/units/add`)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2c3e50', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', fontSize: '14px', fontWeight: 400, cursor: 'pointer', borderRadius: '2px' }}>
                                    <FiPlus size={14} /> Add Unit
                                </button>
                            </div>

                            {/* Units toolbar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', width: '240px' }}>
                                    <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                                    <input
                                        type="text"
                                        placeholder="Search units..."
                                        value={unitSearch}
                                        onChange={e => setUnitSearch(e.target.value)}
                                        style={{
                                            padding: '0.3rem 0.75rem 0.3rem 2rem', fontSize: '14px',
                                            border: '1px solid #d0d1d3', borderRadius: '2px', width: '240px',
                                            fontFamily: FONT, color: '#000', outline: 'none',
                                        }}
                                    />
                                </div>
                                <select
                                    value={unitStatusFilter}
                                    onChange={e => setUnitStatusFilter(e.target.value)}
                                    className="rb-select"
                                    style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
                                >
                                    {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select
                                    value={unitPageSize}
                                    onChange={e => setUnitPageSize(Number(e.target.value))}
                                    className="rb-select"
                                    style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <button onClick={fetchProperty} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fdfdfd', color: '#000', border: '1px solid #ccc', padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400, cursor: 'pointer', borderRadius: '2px' }}>
                                    <FiRefreshCw size={14} /> Refresh
                                </button>
                            </div>

                            {paginatedUnits.length > 0 ? (
                                <div style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={thStyle}></th>
                                                <th style={thStyle}>Property/Tenant</th>
                                                <th style={thStyle}>Details</th>
                                                <th style={thStyle}>Financials</th>
                                                <th style={thStyle}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedUnits.map((unit, index) => {
                                                const unitId = `UNIT${String((currentUnitPage - 1) * unitPageSize + index + 1).padStart(6, "0")}`;
                                                return (
                                                    <tr
                                                        key={unit.id}
                                                        className="rb-row"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => navigate(`/landlord/units/${unit.id}`)}
                                                    >
                                                        <td style={tdStyle}>
                                                            <span style={{ fontWeight: 600, color: '#2471a3', fontSize: '13px' }}>
                                                                {unitId}
                                                            </span>
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <div style={{ fontWeight: 500 }}>{name || "—"}</div>
                                                            <div style={{ marginTop: '2px', fontSize: '11px', color: '#333' }}>
                                                                {unit.tenant_name ? `Tenant: ${unit.tenant_name}` : 'No tenant'}
                                                            </div>
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                                                                {(unit.unit_type || "").replace(/_/g, " ")}
                                                            </div>
                                                            <div style={{ marginTop: '2px', fontSize: '11px', color: '#333' }}>
                                                                {[
                                                                    unit.floor_number != null && `Floor ${unit.floor_number}`,
                                                                    unit.bedrooms != null && `${unit.bedrooms} bed`,
                                                                    unit.bathrooms != null && `${unit.bathrooms} bath`,
                                                                    unit.square_meters != null && `${unit.square_meters} m²`,
                                                                ].filter(Boolean).join(' · ') || 'No additional details'}
                                                            </div>
                                                            <div style={{ marginTop: '3px', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                                {unit.furnished && (
                                                                    <span style={{ padding: '0.1rem 0.4rem', fontSize: '10px', background: '#eaf2f8', color: '#2471a3', fontWeight: 500, borderRadius: '2px' }}>
                                                                        Furnished
                                                                    </span>
                                                                )}
                                                                {unit.parking_bay && (
                                                                    <span style={{ padding: '0.1rem 0.4rem', fontSize: '10px', background: '#eaf2f8', color: '#2471a3', fontWeight: 500, borderRadius: '2px' }}>
                                                                        Parking
                                                                    </span>
                                                                )}
                                                                {unit.has_balcony && (
                                                                    <span style={{ padding: '0.1rem 0.4rem', fontSize: '10px', background: '#e8f8f5', color: '#1abc9c', fontWeight: 500, borderRadius: '2px' }}>
                                                                        Balcony
                                                                    </span>
                                                                )}
                                                                {unit.has_garden && (
                                                                    <span style={{ padding: '0.1rem 0.4rem', fontSize: '10px', background: '#e8f8f5', color: '#1abc9c', fontWeight: 500, borderRadius: '2px' }}>
                                                                        Garden
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <div style={{ fontWeight: 500 }}>
                                                                Rent: {formatAmount(unit.monthly_rent)}
                                                            </div>
                                                            {unit.deposit_amount != null && (
                                                                <div style={{ marginTop: '2px', fontSize: '11px', color: '#333' }}>
                                                                    Deposit: {formatAmount(unit.deposit_amount)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <StatusBadge status={unit.status} />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#555', background: '#f9fafb', border: '1px dashed #dee2e6' }}>
                                    <FiGrid size={30} style={{ marginBottom: '0.8rem', opacity: 0.4 }} />
                                    <p style={{ fontSize: '14px', marginBottom: '0.8rem' }}>No units match your filters.</p>
                                    <button onClick={() => { setUnitSearch(""); setUnitStatusFilter("All"); }} style={{ background: 'transparent', color: '#2471a3', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 400 }}>
                                        Clear filters
                                    </button>
                                </div>
                            )}

                            {/* Pagination */}
                            {paginatedUnits.length > 0 && totalUnitPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0 0' }}>
                                    <button
                                        disabled={currentUnitPage <= 1}
                                        onClick={() => setUnitPage(prev => Math.max(1, prev - 1))}
                                        style={{ padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd', color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px' }}
                                    >
                                        ‹
                                    </button>
                                    {Array.from({ length: totalUnitPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setUnitPage(p)}
                                            style={{
                                                padding: '0.2rem 0.5rem',
                                                border: p === currentUnitPage ? '1px solid #2c3e50' : '1px solid #d0d1d3',
                                                background: p === currentUnitPage ? '#2c3e50' : '#fdfdfd',
                                                color: p === currentUnitPage ? '#ffffff' : '#000',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: p === currentUnitPage ? 600 : 400,
                                                borderRadius: '2px',
                                            }}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        disabled={currentUnitPage >= totalUnitPages}
                                        onClick={() => setUnitPage(prev => Math.min(totalUnitPages, prev + 1))}
                                        style={{ padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd', color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px' }}
                                    >
                                        ›
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FINANCIALS TAB */}
                    {activeTab === "financials" && (
                        <div style={{ padding: '1.2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 500, margin: 0, color: '#000' }}>Financials</h3>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={financialPeriod}
                                        onChange={(e) => setFinancialPeriod(e.target.value)}
                                        className="rb-select"
                                        style={{
                                            padding: '0.4rem 2rem 0.4rem 0.8rem',
                                            fontSize: '14px',
                                            fontWeight: 400,
                                            color: '#000',
                                            background: '#fdfdfd',
                                            border: '1px solid #dee2e6',
                                            cursor: 'pointer',
                                            appearance: 'none',
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none',
                                        }}
                                    >
                                        <option value="ytd">Year to date</option>
                                        <option value="lastYear">Last year</option>
                                        <option value="last3Months">Last 3 months</option>
                                        <option value="last4Years">Last 4 years</option>
                                    </select>
                                    <FiChevronDown size={14} style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <div style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>PROPERTY INCOME STATEMENT</th>
                                            {periodColumns.map(col => (
                                                <th key={col} style={{ ...thStyle, textAlign: 'right' }}>{col}</th>
                                            ))}
                                            <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ ...tdStyle, fontWeight: 700 }}>Net income</td>
                                            {periodColumns.map(col => (
                                                <td key={col} style={{ ...tdStyle, textAlign: 'right', fontWeight: 400 }}>R 0.00</td>
                                            ))}
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 400 }}>R 0.00</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* LEASES TAB */}
                    {activeTab === "leases" && (
                        <div style={{ padding: "0.8rem 0", background: "#fdfdfd", marginBottom: "1rem" }}>
                            <h4 style={{ fontSize: "16px", color: "#000", fontFamily: FONT, paddingLeft: "0.7rem", background: '#f0f4f8cb', margin: '0 0 0.5rem' }}>List of leases</h4>
                            <div style={{ height: "3px", backgroundColor: "#3498db", marginBottom: "0.8rem" }} />

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.75rem" }}>
                                <OutlineButton icon={FaPlus} style={{ marginLeft: "1.2rem" }} onClick={() => navigate(`/landlord/properties/${id}/leases/add`)}>Add a lease</OutlineButton>

                                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                                    <div style={{ position: "relative" }}>
                                        <FiSearch size={14} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: '#555' }} />
                                        <input
                                            value={leaseSearch}
                                            onChange={(e) => setLeaseSearch(e.target.value)}
                                            style={{
                                                padding: "0.4rem 0.75rem 0.4rem 2.1rem", fontSize: "14px", border: `1px solid #d0d1d3`,
                                                borderRadius: "2px", width: "280px", fontFamily: FONT, color: "#000", outline: "none"
                                            }}
                                        />
                                    </div>
                                    <select value={leaseFilter} onChange={(e) => setLeaseFilter(e.target.value)} style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.4rem 1.5rem 0.4rem 0.4rem', background: '#fdfdfd', color: '#000' }}>
                                        <option value="all">All Leases</option>
                                        <option value="active">Active</option>
                                        <option value="ended">Ended</option>
                                    </select>
                                    <select defaultValue="10" style={{ marginLeft: "-1.0rem", marginRight: "1.2rem", border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.4rem 1.5rem 0.4rem 0.4rem', background: '#fdfdfd', color: '#000' }}>
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ borderRadius: "0px", overflow: "hidden", margin: "0 1.2rem 0 1.2rem" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            <th style={thStyle}></th>
                                            <th style={thStyle}>Tenant</th>
                                            <th style={thStyle}>Lease details</th>
                                            <th style={thStyle}>Financials</th>
                                            <th style={thStyle}>State</th>
                                            <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLeases.length > 0 ? (
                                            filteredLeases.map((lease, i) => (
                                                <tr key={lease.id} className="rb-row">
                                                    <td style={tdStyle}>
                                                        <a href="#lease" onClick={(e) => e.preventDefault()} className="rb-link" style={{ fontWeight: 600 }}>
                                                            LEA{String(i + 1).padStart(6, "0")}
                                                        </a>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div>{lease.tenant_name || "—"}</div>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div>Term: {fmtDate(lease?.lease_start_date) || "—"} to {fmtDate(lease?.lease_end_date) || "—"}</div>
                                                        <div>Rental: {formatAmount(lease.rent_amount)}</div>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div>Deposit: {formatAmount(lease.deposit_amount)} held</div>
                                                    </td>
                                                    <td style={tdStyle}>
                                                        {lease.lease_status === "active" ? (
                                                            <div style={{ color: "#27ae60" }}>Active, Next Invoice <div>due on {fmtDate(lease?.next_invoice_date) || "—"}</div></div>
                                                        ) : (
                                                            <div style={{ color: "#e74c3c" }}>Ended</div>
                                                        )}
                                                    </td>
                                                    <td style={{ ...tdStyle, textAlign: "center" }}>
                                                        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                                                            <button className="action-btn" title="Edit"><FiEdit size={13} /></button>
                                                            <button className="action-btn danger" title="Terminate"><FiX size={13} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#555" }}>
                                                    <FiFileText size={28} style={{ marginBottom: "0.6rem", opacity: 0.4 }} />
                                                    <p style={{ fontSize: "14px", marginBottom: "0.6rem" }}>No active leases on this property.</p>
                                                    <a href="#add" onClick={(e) => { e.preventDefault(); navigate(`/landlord/properties/${id}/leases/add`); }} className="rb-link">
                                                        + Create your first lease
                                                    </a>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {filteredLeases.length > 0 && (
                                    <div style={{ fontSize: "13px", textAlign: "right", fontWeight: 400, color: '#333' }}>
                                        {filteredLeases.length} item{filteredLeases.length === 1 ? "" : "s"} found.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === "reports" && (
                        <div style={{ padding: '1.2rem' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 0.8rem', color: '#000' }}>Reports</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.8rem' }}>
                                {[
                                    { icon: FiHome, color: '#3498db', title: 'Occupancy Report', desc: 'Current occupancy rate, vacant vs occupied units breakdown.' },
                                    { icon: FiBarChart2, color: '#27ae60', title: 'Income Statement', desc: 'Revenue, expenses, and net income summary for this property.' },
                                    { icon: FiUsers, color: '#8e44ad', title: 'Tenant Report', desc: 'List of tenants, lease status, and contact information.' },
                                    { icon: FiTool, color: '#e67e22', title: 'Maintenance Report', desc: 'Maintenance requests, costs, and resolution timeline.' },
                                ].map((report, i) => (
                                    <div key={i} style={{ border: '1px solid #e9ecef', padding: '1rem', background: '#fdfdfd', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                            <report.icon size={16} style={{ color: report.color }} />
                                            <span style={{ fontWeight: 500, fontSize: '14px', color: '#000' }}>{report.title}</span>
                                        </div>
                                        <p style={{ fontSize: '13px', color: '#333', margin: '0 0 0.8rem', lineHeight: 1.4 }}>{report.desc}</p>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '13px', fontWeight: 400, background: '#2c3e50', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                                <FiDownload size={13} /> PDF
                                            </button>
                                            <button style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '13px', fontWeight: 400, background: '#fdfdfd', color: '#000', border: '1px solid #dee2e6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                                <FiEye size={13} /> View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}