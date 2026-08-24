/* eslint-disable react-hooks/exhaustive-deps */
// LANDLORD REPORTS PAGE
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { FiChevronRight } from "react-icons/fi";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = "http://localhost:4000";

const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const C = {
  background: "#ffffff",
  card: "#ffffff",
  border: "#dfe3e8",
  primary: "#2c3e50",
  blue: "#3498db",
  green: "#2b7a4b",
  red: "#9e3a3a",
  purple: "#6f42c1",
  text: "#1f2328",
  textMuted: "#5f6b7a",
  accent: "#3498db",
};

function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }

const cardStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: '3px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const inputStyle = {
  padding: '0.5rem 0.8rem',
  borderRadius: '2px',
  background: '#fdfdfd',
  border: `1px solid ${C.border}`,
  color: C.text,
  fontFamily: FONT,
  fontSize: '14px',
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
  paddingRight: '1.8rem',
};

const btnPrimary = {
  background: C.primary,
  color: '#ffffff',
  border: 'none',
  padding: '0.4rem 1rem',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: FONT,
  borderRadius: '2px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const btnGhost = {
  background: '#fdfdfd',
  color: C.text,
  border: `1px solid ${C.border}`,
  padding: '0.4rem 1rem',
  fontSize: '14px',
  fontWeight: 400,
  fontFamily: FONT,
  borderRadius: '2px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const REPORT_TYPES = [
  { id: 'rent-roll', icon: 'file-text', label: 'Rent Roll', desc: 'All tenants, units, rent amounts & balances' },
  { id: 'collections', icon: 'credit-card', label: 'Payment Collections', desc: 'Payments collected for a date range' },
  { id: 'maintenance', icon: 'wrench', label: 'Maintenance Costs', desc: 'Repair costs by property & category' },
  { id: 'occupancy', icon: 'home', label: 'Occupancy Report', desc: 'Vacancy rates & occupancy trends' },
  { id: 'tenant-ledger', icon: 'users', label: 'Tenant Ledger', desc: 'Full payment history per tenant' },
  { id: 'reliability', icon: 'shield', label: 'Tenant Reliability', desc: 'Risk scores & payment behavior' },
  { id: 'arrears', icon: 'alert', label: 'Arrears Report', desc: 'Overdue balances & collections' },
];

function RentRollTable({ data }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {["Tenant", "Unit", "Property", "Rent", "Frequency", "Lease End", "Balance", "Status"].map(h => (
              <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: '#f7f8fa' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
              <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.text }}>{row.tenant}</td>
              <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.unit}</td>
              <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.property}</td>
              <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.text }}>{format(row.rent)}</td>
              <td style={{ padding: '0.55rem 0.8rem', color: C.text, textTransform: 'capitalize' }}>{row.frequency}</td>
              <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{formatDate(row.leaseEnd)}</td>
              <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: row.balance > 0 ? C.red : C.green }}>{row.balance > 0 ? format(row.balance) : "Clear"}</td>
              <td style={{ padding: '0.55rem 0.8rem' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 500, padding: '0.1rem 0.5rem', borderRadius: '12px',
                  color: row.status === 'Active' ? C.green : C.red,
                  background: row.status === 'Active' ? 'rgba(43,122,75,0.1)' : 'rgba(158,58,58,0.1)',
                  border: `1px solid ${row.status === 'Active' ? 'rgba(43,122,75,0.2)' : 'rgba(158,58,58,0.2)'}`,
                }}>{row.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CollectionsTable({ data, dateRange }) {
  const total = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '12px' }}>
        <span style={{ color: C.text }}>
          {dateRange.from && dateRange.to ? `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}` : "All dates"}
        </span>
        <span style={{ fontWeight: 600, color: C.text }}>Total Collected: <span style={{ color: C.green }}>{format(total)}</span></span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Tenant", "Unit", "Amount", "Due Date", "Date Paid", "Method", "Status"].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: '#f7f8fa' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: C.text }}>No payments found for this period.</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.text }}>{row.tenant}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.unit}</td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.text }}>{format(row.amount)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{formatDate(row.due)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.paid ? formatDate(row.paid) : "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.method || "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '0.1rem 0.5rem', borderRadius: '12px',
                    color: row.status === 'Paid' ? C.green : row.status === 'Late' ? C.red : C.blue,
                    background: row.status === 'Paid' ? 'rgba(43,122,75,0.1)' : 'rgba(52,152,219,0.1)',
                    border: `1px solid ${row.status === 'Paid' ? 'rgba(43,122,75,0.2)' : 'rgba(52,152,219,0.2)'}`,
                  }}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArrearsTable({ data }) {
  const bands = { '30': 0, '60': 0, '90': 0, '90plus': 0 };
  data.forEach(d => {
    if (d.daysOverdue <= 30) bands['30'] += Number(d.balance) || 0;
    else if (d.daysOverdue <= 60) bands['60'] += Number(d.balance) || 0;
    else if (d.daysOverdue <= 90) bands['90'] += Number(d.balance) || 0;
    else bands['90plus'] += Number(d.balance) || 0;
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '1.2rem' }}>
        {[
          { label: '1-30 Days', value: bands['30'], color: C.blue },
          { label: '31-60 Days', value: bands['60'], color: C.primary },
          { label: '61-90 Days', value: bands['90'], color: C.red },
          { label: '90+ Days', value: bands['90plus'], color: C.red },
        ].map(band => (
          <div key={band.label} style={{ padding: '0.8rem', borderRadius: '3px', background: `${band.color}10`, border: `1px solid ${band.color}20`, textAlign: 'center' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase' }}>{band.label}</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: band.color, marginTop: '2px' }}>{format(band.value)}</p>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Tenant", "Unit", "Property", "Balance", "Days Overdue", "Last Payment", "Status"].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: '#f7f8fa' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: C.text }}>No arrears — all tenants are up to date!</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.text }}>{row.tenant}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.unit}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.property}</td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.red }}>{format(row.balance)}</td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: row.daysOverdue > 60 ? C.red : C.primary }}>{row.daysOverdue}d</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.lastPayment ? formatDate(row.lastPayment) : "Never"}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '0.1rem 0.5rem', borderRadius: '12px',
                    color: row.collectionsStatus === 'collections' ? C.red : C.primary,
                    background: row.collectionsStatus === 'collections' ? 'rgba(158,58,58,0.1)' : 'rgba(44,62,80,0.08)',
                    border: `1px solid ${row.collectionsStatus === 'collections' ? 'rgba(158,58,58,0.2)' : 'rgba(44,62,80,0.2)'}`,
                  }}>{row.collectionsStatus === 'collections' ? 'Collections' : 'Overdue'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReliabilityTable({ data }) {
  const count = (score) => data.filter(d => d.score === score).length;
  const reliable = count('reliable');
  const moderate = count('moderate_risk');
  const high = count('high_risk');
  const avg = data.length
    ? (data.reduce((sum, d) => sum + (Number(d.score_value) || 0), 0) / data.length).toFixed(1)
    : '—';

  const scoreColor = (score) => {
    if (score === 'reliable') return C.green;
    if (score === 'moderate_risk') return C.primary;
    if (score === 'high_risk') return C.red;
    return C.textMuted;
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1.2rem' }}>
        <div style={{ padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(43,122,75,0.06)', border: '1px solid rgba(43,122,75,0.15)', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase' }}>Reliable</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.green }}>{reliable}</p>
        </div>
        <div style={{ padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(44,62,80,0.06)', border: '1px solid rgba(44,62,80,0.15)', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase' }}>Moderate Risk</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.primary }}>{moderate}</p>
        </div>
        <div style={{ padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(158,58,58,0.06)', border: '1px solid rgba(158,58,58,0.15)', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase' }}>High Risk</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.red }}>{high}</p>
        </div>
        <div style={{ padding: '0.7rem 0.9rem', borderRadius: '3px', background: '#f9fafb', border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase' }}>Average Score</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.text }}>{avg}</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Tenant", "Unit", "Property", "Score", "Balance", "Days Overdue", "Warnings", "Fines", "Lease"].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: '#f7f8fa' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: C.text }}>No reliability data found.</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.text }}>{row.tenant}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.unit}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.property}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '0.1rem 0.5rem', borderRadius: '12px',
                      color: scoreColor(row.score), background: `${scoreColor(row.score)}15`,
                      border: `1px solid ${scoreColor(row.score)}30`,
                    }}>
                      {row.score?.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontWeight: 600, color: C.text }}>{row.score_value != null ? Number(row.score_value).toFixed(1) : '—'}</span>
                  </div>
                </td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: row.balance > 0 ? C.red : C.green }}>
                  {row.balance > 0 ? format(row.balance) : 'Clear'}
                </td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: row.days_overdue > 60 ? C.red : C.primary }}>
                  {row.days_overdue > 0 ? `${row.days_overdue}d` : '—'}
                </td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.warnings}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.fines != null && row.fines > 0 ? format(row.fines) : '—'}</td>
                <td style={{ padding: '0.55rem 0.8rem', textTransform: 'capitalize', color: C.text }}>
                  {row.lease_status || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MaintenanceCostTable({ data }) {
  const totalCost = data.reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const byProperty = {};
  data.forEach(r => {
    const prop = r.property || 'Unknown';
    byProperty[prop] = (byProperty[prop] || 0) + (Number(r.cost) || 0);
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {Object.entries(byProperty).map(([prop, cost]) => (
          <div key={prop} style={{ padding: '0.7rem 0.9rem', borderRadius: '3px', background: '#f9fafb', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: C.text }}>{prop}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: C.primary }}>{format(cost)}</span>
          </div>
        ))}
        <div style={{ padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(43,122,75,0.06)', border: '1px solid rgba(43,122,75,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: C.green }}>Total</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: C.green }}>{format(totalCost)}</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Request", "Property", "Category", "Priority", "Cost", "Date"].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: '#f7f8fa' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: C.text }}>No maintenance costs recorded.</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.text, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.title}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.property}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.category || "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '0.1rem 0.5rem', borderRadius: '12px',
                    color: row.priority === 'urgent' ? C.red : row.priority === 'high' ? C.primary : C.text,
                    background: row.priority === 'urgent' ? 'rgba(158,58,58,0.1)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${row.priority === 'urgent' ? 'rgba(158,58,58,0.2)' : C.border}`,
                  }}>{row.priority}</span>
                </td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.primary }}>{format(row.cost)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{formatDate(row.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OccupancyTable({ data }) {
  const totalUnits = data.reduce((s, p) => s + p.total, 0);
  const totalOccupied = data.reduce((s, p) => s + p.occupied, 0);
  const overallRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: C.text, textTransform: 'uppercase' }}>Overall Occupancy</p>
        <p style={{ fontSize: '2rem', fontWeight: 700, color: overallRate >= 80 ? C.green : overallRate >= 50 ? C.primary : C.red }}>{overallRate}%</p>
        <p style={{ fontSize: '12px', color: C.text }}>{totalOccupied} / {totalUnits} units occupied</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Property", "Total Units", "Occupied", "Vacant", "Maintenance", "Occupancy Rate"].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: '#f7f8fa' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const rate = row.total > 0 ? Math.round((row.occupied / row.total) * 100) : 0;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                  <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.text }}>{row.property}</td>
                  <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.total}</td>
                  <td style={{ padding: '0.55rem 0.8rem', color: C.green, fontWeight: 600 }}>{row.occupied}</td>
                  <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.vacant}</td>
                  <td style={{ padding: '0.55rem 0.8rem', color: C.primary }}>{row.maintenance || 0}</td>
                  <td style={{ padding: '0.55rem 0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: 5, borderRadius: '3px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: 5, borderRadius: '3px', background: rate >= 80 ? C.green : rate >= 50 ? C.primary : C.red, width: `${rate}%` }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>{rate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TenantLedgerTable({ data, selectedTenant }) {
  if (!selectedTenant) return <p style={{ textAlign: 'center', padding: '2rem', color: C.text }}>Select a tenant to view their ledger.</p>;

  const totalPaid = data.filter(p => p.status === 'Paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalOutstanding = data.filter(p => p.status !== 'Paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.6rem 0.9rem', borderRadius: '3px', background: 'rgba(43,122,75,0.06)', border: '1px solid rgba(43,122,75,0.15)' }}>
          <span style={{ fontSize: '11px', color: C.text }}>Total Paid</span>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: C.green }}>{format(totalPaid)}</p>
        </div>
        <div style={{ padding: '0.6rem 0.9rem', borderRadius: '3px', background: 'rgba(158,58,58,0.06)', border: '1px solid rgba(158,58,58,0.15)' }}>
          <span style={{ fontSize: '11px', color: C.text }}>Outstanding</span>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: C.red }}>{format(totalOutstanding)}</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Period", "Amount", "Due Date", "Date Paid", "Method", "Status"].map(h => (
                <th key={h} style={{ fontSize: '11px', fontWeight: 600, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: '#f7f8fa' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: C.text }}>No payment history.</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.text }}>{row.period || "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.text }}>{format(row.amount)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{formatDate(row.due)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.paid ? formatDate(row.paid) : "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: C.text }}>{row.method || "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 500, padding: '0.1rem 0.5rem', borderRadius: '12px',
                    color: row.status === 'Paid' ? C.green : C.red,
                    background: row.status === 'Paid' ? 'rgba(43,122,75,0.1)' : 'rgba(158,58,58,0.1)',
                    border: `1px solid ${row.status === 'Paid' ? 'rgba(43,122,75,0.2)' : 'rgba(158,58,58,0.2)'}`,
                  }}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  useDocumentTitle("Reports");
  const toast = useToast();

  const [activeReport, setActiveReport] = useState('rent-roll');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenants, setTenants] = useState([]);

  const activeReportConfig = REPORT_TYPES.find(r => r.id === activeReport);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = { report: activeReport };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (selectedTenant?.id) params.tenant_id = selectedTenant.id;

      const { data } = await axios.get(`${API}/reports`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setReportData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch report:", err);
      setReportData([]);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, [activeReport, dateFrom, dateTo, selectedTenant]);

  useEffect(() => {
    fetchReport();
    if (activeReport === 'tenant-ledger') {
      const token = localStorage.getItem("token");
      axios.get(`${API}/tenants`, { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => {
          setTenants(data.tenants || []);
        })
        .catch(() => { });
    }
  }, [fetchReport, activeReport]);

  function handleExport() {
    if (!reportData) return;
    const rows = Array.isArray(reportData) ? reportData : [];
    let csv = '';
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      csv += headers.join(',') + '\n';
      rows.forEach(row => {
        csv += headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported!");
  }

  function handleExportPDF() {
    if (!reportData || reportData.length === 0) return;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const reportLabel = activeReportConfig?.label || activeReport;
    const date = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${reportLabel} Report`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${date}`, 14, 28);

    let columns = [], rows = [];
    switch (activeReport) {
      case 'rent-roll':
        columns = ['Tenant', 'Unit', 'Property', 'Rent', 'Frequency', 'Lease End', 'Balance', 'Status'];
        rows = reportData.map(r => [r.tenant, r.unit, r.property, format(r.rent), r.frequency, formatDate(r.leaseEnd), r.balance > 0 ? format(r.balance) : 'Clear', r.status]);
        break;
      case 'collections':
        columns = ['Tenant', 'Unit', 'Amount', 'Due Date', 'Date Paid', 'Method', 'Status'];
        rows = reportData.map(r => [r.tenant, r.unit, format(r.amount), formatDate(r.due), r.paid ? formatDate(r.paid) : '—', r.method || '—', r.status]);
        break;
      case 'maintenance':
        columns = ['Request', 'Property', 'Category', 'Priority', 'Cost', 'Date'];
        rows = reportData.map(r => [r.title, r.property, r.category, r.priority, format(r.cost), formatDate(r.date)]);
        break;
      case 'occupancy':
        columns = ['Property', 'Total Units', 'Occupied', 'Vacant', 'Maintenance', 'Occupancy Rate'];
        rows = reportData.map(r => [r.property, r.total, r.occupied, r.vacant, r.maintenance || 0, `${r.total > 0 ? Math.round((r.occupied / r.total) * 100) : 0}%`]);
        break;
      case 'tenant-ledger':
        columns = ['Period', 'Amount', 'Due Date', 'Date Paid', 'Method', 'Status'];
        rows = reportData.map(r => [r.period || '—', format(r.amount), formatDate(r.due), r.paid ? formatDate(r.paid) : '—', r.method || '—', r.status]);
        break;
      case 'reliability':
        columns = ['Tenant', 'Unit', 'Property', 'Score', 'Score Value', 'Balance', 'Days Overdue', 'Warnings', 'Fines', 'Lease'];
        rows = reportData.map(r => [
          r.tenant, r.unit, r.property,
          r.score?.replace(/_/g, ' '),
          r.score_value != null ? Number(r.score_value).toFixed(1) : '—',
          r.balance > 0 ? format(r.balance) : 'Clear',
          r.days_overdue > 0 ? `${r.days_overdue}d` : '—',
          r.warnings,
          r.fines != null ? format(r.fines) : '—',
          r.lease_status || '—',
        ]);
        break;
      case 'arrears':
        columns = ['Tenant', 'Unit', 'Property', 'Balance', 'Days Overdue', 'Last Payment', 'Status'];
        rows = reportData.map(r => [
          r.tenant, r.unit, r.property,
          format(r.balance), `${r.daysOverdue}d`,
          r.lastPayment ? formatDate(r.lastPayment) : 'Never',
          r.collectionsStatus === 'collections' ? 'Collections' : 'Overdue',
        ]);
        break;
    }

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text(`Chihwa Rentals - ${reportLabel} - Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    doc.save(`${reportLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exported!");
  }

  const S = {
    container: { padding: '1rem', fontFamily: FONT, color: C.text, background: '#ffffff' },
    title: { fontSize: '1.2rem', fontWeight: 500, color: C.text, margin: 0 },
    subtitle: { fontSize: '13px', color: C.textMuted, margin: '0.2rem 0 0' },
    sectionTitle: { fontSize: '15px', fontWeight: 500, color: C.text, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .reports-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" style={{ color: '#2471a3', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Reports</span>
      </div>

      {/* Main card */}
      <div style={cardStyle}>
        {/* Header */}
        <div style={{
          background: '#f7f8fa', padding: '0.8rem 1.2rem', borderBottom: `3px solid ${C.accent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <h1 style={S.title}>Reports</h1>
            <p style={S.subtitle}>Generate and export reports for your properties</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleExport} disabled={!reportData} style={{ ...btnPrimary, opacity: reportData ? 1 : 0.4, cursor: reportData ? 'pointer' : 'not-allowed' }}>
              <Icon name="download" size={13} /> Export CSV
            </button>
            <button onClick={handleExportPDF} disabled={!reportData} style={{ ...btnGhost, opacity: reportData ? 1 : 0.4, cursor: reportData ? 'pointer' : 'not-allowed' }}>
              <Icon name="download" size={13} /> Export PDF
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.2rem', alignItems: 'start', padding: '1rem' }}>
          {/* Sidebar */}
          <div className="reports-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {REPORT_TYPES.map(report => (
              <div key={report.id} onClick={() => { setActiveReport(report.id); setReportData(null); setSelectedTenant(null); }} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.7rem', padding: '0.8rem 1rem',
                cursor: 'pointer', borderRadius: '3px',
                background: activeReport === report.id ? 'rgba(44,62,80,0.06)' : 'transparent',
                border: `1px solid ${activeReport === report.id ? C.primary : 'transparent'}`,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (activeReport !== report.id) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                onMouseLeave={e => { if (activeReport !== report.id) e.currentTarget.style.background = 'transparent'; }}>
                <Icon name={report.icon} size={16} color={activeReport === report.id ? C.primary : C.text} style={{ marginTop: '1px' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: activeReport === report.id ? 600 : 400, color: activeReport === report.id ? C.primary : C.text, margin: 0 }}>{report.label}</p>
                  <p style={{ fontSize: '12px', color: C.textMuted, margin: '2px 0 0' }}>{report.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="reports-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(activeReport === 'collections' || activeReport === 'maintenance') && (
                  <>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                    <span style={{ color: C.text }}>to</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
                    <button onClick={fetchReport} style={{ ...btnGhost, padding: '0.45rem 0.8rem', fontSize: '13px' }}>Apply</button>
                  </>
                )}
                {activeReport === 'tenant-ledger' && (
                  <select value={selectedTenant?.id || ""} onChange={e => {
                    const t = tenants.find(tn => tn.id === e.target.value);
                    setSelectedTenant(t || null);
                  }} style={{ ...selectStyle, width: 220 }}>
                    <option value="">Select a tenant...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim()} — {t.unit_number ? `Unit ${t.unit_number}` : t.property_name || ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Report display */}
            <div style={cardStyle}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, background: '#f7f8fa' }}>
                <h3 style={S.sectionTitle}>
                  <Icon name={activeReportConfig?.icon} size={16} color={C.primary} />
                  {activeReportConfig?.label}
                </h3>
              </div>
              <div style={{ padding: '1rem 1.5rem' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.1)', borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    Generating report...
                  </div>
                ) : reportData ? (
                  <>
                    {activeReport === 'rent-roll' && <RentRollTable data={reportData} />}
                    {activeReport === 'collections' && <CollectionsTable data={reportData} dateRange={{ from: dateFrom, to: dateTo }} />}
                    {activeReport === 'maintenance' && <MaintenanceCostTable data={reportData} />}
                    {activeReport === 'occupancy' && <OccupancyTable data={reportData} />}
                    {activeReport === 'tenant-ledger' && <TenantLedgerTable data={reportData} selectedTenant={selectedTenant} />}
                    {activeReport === 'reliability' && <ReliabilityTable data={reportData} />}
                    {activeReport === 'arrears' && <ArrearsTable data={reportData} />}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: C.text }}>
                    <p>Select a report type and configure filters, then click Apply.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}