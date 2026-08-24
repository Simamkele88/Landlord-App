/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "../../../contexts/ToastContext";
import { FiX, FiSearch, FiChevronDown, FiChevronRight } from "react-icons/fi";
import useDocumentTitle from "../../../hooks/useDocumentTitle";


const API = "http://localhost:4000";
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

const inputStyle = {
  width: "100%",
  padding: "0.4rem 0.6rem",
  fontSize: "14px",
  color: "#000",
  background: "#fdfdfd",
  border: "1px solid #dee2e6",
  borderRadius: "2px",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};
const labelStyle = { display: "block", fontSize: "13px", fontWeight: 500, color: "#000", marginBottom: "0.3rem" };
const fieldWrap = { marginBottom: "0.8rem" };
const sectionTitle = { fontSize: "14px", fontWeight: 600, color: "#000", margin: "0 0 0.8rem" };
const checkboxRow = { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "14px", color: "#000", cursor: "pointer" };
const outlineBtnStyle = {
  display: "flex", alignItems: "center", gap: "0.4rem",
  background: "#fdfdfd", color: "#000", border: "1px solid #d0d1d3",
  padding: "0.3rem 0.6rem", fontSize: "14px", fontWeight: 400,
  cursor: "pointer", borderRadius: "2px",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage: "none",
  paddingRight: "2rem",
};

export default function PropertyCreate({ onClose }) {
  useDocumentTitle("Create Property");
  const navigate = useNavigate();
  const toast = useToast();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [showHelp, setShowHelp] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [caretakers, setCaretakers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    property_type: "residential",
    address_line1: "",
    address_line2: "",
    city: "",
    province: "",
    postal_code: "",
    country: "South Africa",
    caretaker_id: "",
    year_built: "",
    total_floors: "",
    total_units: "",
    has_elevator: false,
    has_parking: false,
    parking_spots: "",
    has_security: false,
    has_pool: false,
    pet_friendly: false,
    monthly_rates: "",
    monthly_levies: "",
    latitude: null,
    longitude: null,
  });

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

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
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  function placeMarker(lat, lng) {
    setField("latitude", Number(lat.toFixed(7)));
    setField("longitude", Number(lng.toFixed(7)));
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else if (mapRef.current) {
      markerRef.current = L.marker([lat, lng], {
        icon: softMarkerIcon,
        draggable: true,
      }).addTo(mapRef.current);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current.getLatLng();
        setField("latitude", Number(pos.lat.toFixed(7)));
        setField("longitude", Number(pos.lng.toFixed(7)));
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
  }

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API}/landlord/caretakers/not-assigned`, { headers: { Authorization: `Bearer ${token}` } });
        setCaretakers(data.caretakers || data || []);
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to fetch caretakers.");
      }
    })();
  }, []);

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Display name is required";
    if (!form.address_line1.trim()) next.address_line1 = "Street address is required";
    if (!form.city.trim()) next.city = "City is required";
    if (form.postal_code && !/^\d{4}$/.test(form.postal_code)) next.postal_code = "Postal code must be 4 digits";
    if (form.latitude == null || form.longitude == null) next.location = "Click on the map to set a location";
    if (form.has_parking && form.parking_spots !== "" && Number(form.parking_spots) < 0) next.parking_spots = "Can't be negative";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: form.name.trim(),
        property_type: form.property_type,
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim(),
        province: form.province || null,
        postal_code: form.postal_code || null,
        country: form.country || "South Africa",
        caretaker_id: form.caretaker_id || null,
        year_built: form.year_built ? Number(form.year_built) : null,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        total_units: form.total_units ? Number(form.total_units) : null,
        has_elevator: form.has_elevator,
        has_parking: form.has_parking,
        parking_spots: form.has_parking && form.parking_spots ? Number(form.parking_spots) : null,
        has_security: form.has_security,
        has_pool: form.has_pool,
        pet_friendly: form.pet_friendly,
        monthly_rates: form.monthly_rates ? Number(form.monthly_rates) : null,
        monthly_levies: form.monthly_levies ? Number(form.monthly_levies) : null,
        latitude: form.latitude,
        longitude: form.longitude,
      };
      const { data } = await axios.post(`${API}/properties`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Property created.");
      navigate(`/landlord/properties/${data.property?.id || data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create property.");
    } finally {
      setSaving(false);
    }
  }

  const handleCancel = () => {
    if (onClose) onClose();
    else navigate('/landlord/properties');
  };

  return (
    <div style={{
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif',
      color: "#000",
      background: "#fafafa",
      borderTop: "1px solid #e9ecef",
      borderBottom: "1px solid #e9ecef",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      borderRadius: "3px",
      fontSize: "14px",
    }}>
      <style>{`
        .leaflet-container { font-family: inherit; }
        input:focus, select:focus, textarea:focus { border-color: #3498db !important; box-shadow: 0 0 0 2px rgba(52,152,219,0.1); }
      `}</style>

      {/* Breadcrumb */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        marginBottom: "0.75rem",
        fontSize: "14px",
        fontWeight: 400,
        color: "#333",
        padding: "0.55rem 0.8rem",
        background: "#fdfdfd",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        border: "1px solid #e9ecef",
      }}>
        <FiChevronRight size={13} style={{ color: "#555" }} />
        <Link to="/landlord/dashboard" style={{ color: "#2471a3", textDecoration: "none" }}>Dashboard</Link>
        <span style={{ color: "#555" }}>/</span>
        <Link to="/landlord/properties" style={{ color: "#2471a3", textDecoration: "none" }}>Properties</Link>
        <span style={{ color: "#555" }}>/</span>
        <span style={{ color: "#000" }}>Create Property</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #3498db", borderTop: "1px solid #e9ecef", backgroundColor: "#f7f8fa", padding: "0.4rem 0 0.2rem 0.7rem", borderRadius: "3px 3px 0 0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <h4 style={{ fontSize: "16px", margin: 0, color: "#000" }}>Create a new property</h4>
        {onClose && (
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555" }}>
            <FiX size={18} />
          </button>
        )}
      </div>

      {showHelp && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem 1.2rem", background: "#eaf2f8", color: "#2471a3", fontSize: "13px" }}>
          <span><strong>Help</strong>: Mark the location of the property on the map below; click on the map to set a marker or drag the marker to the correct position.</span>
          <button onClick={() => setShowHelp(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#2471a3" }}>
            <FiX size={15} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ padding: "1.2rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
          <div style={{ flex: "1 1 420px", minWidth: 300 }}>
            <div style={{ position: "relative", marginBottom: "0.6rem" }}>
              <FiSearch size={14} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#555", zIndex: 500 }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Enter a street / suburb to move the map"
                style={{ ...inputStyle, paddingLeft: "2rem", position: "relative", zIndex: 400 }}
              />
              {searchResults.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fdfdfd", border: "1px solid #dee2e6", zIndex: 500, maxHeight: 220, overflowY: "auto" }}>
                  {searchResults.map((r, i) => (
                    <button key={i} type="button" onClick={() => goToSearchResult(r)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.8rem", fontSize: "13px", background: "transparent", border: "none", borderBottom: "1px solid #f1f3f5", cursor: "pointer", color: "#000" }}>
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div ref={mapContainerRef} style={{ height: 400, border: "1px solid #dee2e6", borderRadius: "2px" }} />
            <div style={{ marginTop: "0.5rem", fontSize: "13px", color: "#000" }}>
              Location:{" "}
              {form.latitude != null ? (
                <span>{form.latitude}, {form.longitude}</span>
              ) : (
                <span style={{ color: "#c0392b" }}>Please click on the map to set a location.</span>
              )}
            </div>
            {errors.location && <div style={{ color: "#c0392b", fontSize: "13px", marginTop: "0.2rem" }}>{errors.location}</div>}
          </div>

          <div style={{ flex: "1 1 380px", minWidth: 280 }}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Property name:</label>
              <input value={form.name} onChange={e => setField("name", e.target.value)} maxLength={200} 
                style={{ ...inputStyle, borderColor: errors.name ? "#c0392b" : "#dee2e6" }} />
              {errors.name && <div style={{ color: "#c0392b", fontSize: "13px", marginTop: "0.2rem" }}>{errors.name}</div>}
            </div>

            <label style={{ ...labelStyle, marginBottom: "0.4rem" }}>Property address:</label>
            <div style={fieldWrap}>
              <input value={form.address_line1} onChange={e => setField("address_line1", e.target.value)} placeholder="Address Line 1"
                style={{ ...inputStyle, borderColor: errors.address_line1 ? "#c0392b" : "#dee2e6" }} />
              {errors.address_line1 && <div style={{ color: "#c0392b", fontSize: "13px", marginTop: "0.2rem" }}>{errors.address_line1}</div>}
            </div>
            <div style={fieldWrap}>
              <input value={form.address_line2} onChange={e => setField("address_line2", e.target.value)} style={inputStyle} placeholder="Address Line 2"/>
            </div>
            <div style={{ display: "flex", gap: "0.8rem", marginBottom: "0.8rem" }}>
              <input value={form.city} onChange={e => setField("city", e.target.value)} placeholder="City"
                style={{ ...inputStyle, borderColor: errors.city ? "#c0392b" : "#dee2e6" }} />
            </div>
            <div style={{ display: "flex", gap: "0.8rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <select value={form.province} onChange={e => setField("province", e.target.value)} style={selectStyle}>
                  <option value="">Province</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <FiChevronDown size={14} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#555" }} />
              </div>
              <input value={form.postal_code} onChange={e => setField("postal_code", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Postal code"
                style={{ ...inputStyle, flex: 1, borderColor: errors.postal_code ? "#c0392b" : "#dee2e6" }} />
            </div>
            {errors.postal_code && <div style={{ color: "#c0392b", fontSize: "13px", marginTop: "0.2rem" }}>{errors.postal_code}</div>}
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #e9ecef", margin: "1.2rem 0" }} />

        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
          <div style={{ flex: "1 1 260px" }}>
            <label style={labelStyle}>Property type</label>
            <div style={{ position: "relative" }}>
              <select value={form.property_type} onChange={e => setField("property_type", e.target.value)} style={selectStyle}>
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <FiChevronDown size={14} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#555" }} />
            </div>
          </div>
          <div style={{ flex: "1 1 260px" }}>
            <label style={labelStyle}>Caretaker <span style={{ color: "#555" }}>(optional)</span></label>
            <div style={{ position: "relative" }}>
              <select value={form.caretaker_id} onChange={e => setField("caretaker_id", e.target.value)} style={selectStyle}>
                <option value="">Assign later</option>
                {caretakers.map(c => <option key={c.id} value={c.id}>{c.name || c.full_name}</option>)}
              </select>
              <FiChevronDown size={14} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#555" }} />
            </div>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #e9ecef", margin: "1.2rem 0" }} />

        <h3 style={sectionTitle}>Building details</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ flex: "1 1 140px" }}>
            <label style={labelStyle}>Year built</label>
            <input type="number" value={form.year_built} onChange={e => setField("year_built", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={labelStyle}>Total floors</label>
            <input type="number" min="0" value={form.total_floors} onChange={e => setField("total_floors", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={labelStyle}>Total units</label>
            <input type="number" min="0" value={form.total_units} onChange={e => setField("total_units", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <h3 style={sectionTitle}>Amenities</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
          <label style={checkboxRow}><input type="checkbox" checked={form.has_elevator} onChange={e => setField("has_elevator", e.target.checked)} /> Elevator</label>
          <label style={checkboxRow}><input type="checkbox" checked={form.has_parking} onChange={e => setField("has_parking", e.target.checked)} /> Parking</label>
          <label style={checkboxRow}><input type="checkbox" checked={form.has_security} onChange={e => setField("has_security", e.target.checked)} /> Security</label>
          <label style={checkboxRow}><input type="checkbox" checked={form.has_pool} onChange={e => setField("has_pool", e.target.checked)} /> Pool</label>
          <label style={checkboxRow}><input type="checkbox" checked={form.pet_friendly} onChange={e => setField("pet_friendly", e.target.checked)} /> Pet Friendly</label>
        </div>
        {form.has_parking && (
          <div style={{ maxWidth: 160, marginBottom: "1rem" }}>
            <label style={labelStyle}>Parking spots</label>
            <input type="number" min="0" value={form.parking_spots} onChange={e => setField("parking_spots", e.target.value)}
              style={{ ...inputStyle, borderColor: errors.parking_spots ? "#c0392b" : "#dee2e6" }} />
            {errors.parking_spots && <div style={{ color: "#c0392b", fontSize: "13px", marginTop: "0.2rem" }}>{errors.parking_spots}</div>}
          </div>
        )}

        <hr style={{ border: "none", borderTop: "1px solid #e9ecef", margin: "0 0 1rem" }} />

        <h3 style={sectionTitle}>Monthly costs</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Rates (R)</label>
            <input type="number" min="0" step="0.01" value={form.monthly_rates} onChange={e => setField("monthly_rates", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={labelStyle}>Levies (R)</label>
            <input type="number" min="0" step="0.01" value={form.monthly_levies} onChange={e => setField("monthly_levies", e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", paddingTop: "1rem", borderTop: "1px solid #e9ecef" }}>
          <button type="button" onClick={handleCancel} style={outlineBtnStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            background: "#2c3e50", color: "#ffffff", border: "none",
            padding: "0.4rem 1rem", fontSize: "14px", fontWeight: 500,
            cursor: "pointer", borderRadius: "2px",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Creating..." : "Create Property"}
          </button>
        </div>
      </form>
    </div>
  );
}