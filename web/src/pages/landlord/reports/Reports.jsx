/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// LANDLORD REPORTS PAGE
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = "http://localhost:4000";

function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
};

const statCardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px',
  padding: '1.2rem', cursor: 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s',
  borderLeft: '3px solid transparent',
};

const inputStyle = {
  padding: '0.5rem 0.8rem', borderRadius: '3px', background: C.black,
  border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm,
  fontSize: '0.78rem', outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2rem',
};

const btnPrimary = {
  background: C.gold, color: C.black, border: 'none',
  padding: '0.55rem 1.2rem', fontSize: '0.74rem', fontWeight: 700,
  fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
};

const btnGhost = {
  background: 'transparent', color: 'rgba(245,240,232,0.5)',
  border: `1px solid ${C.border}`, padding: '0.55rem 1.2rem',
  fontSize: '0.74rem', fontWeight: 500, fontFamily: F.dm,
  letterSpacing: '0.04em', borderRadius: '3px', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
};

const REPORT_TYPES = [
  { id: 'rent-roll',       icon: 'file-text',  label: 'Rent Roll',        desc: 'All tenants, units, rent amounts & balances' },
  { id: 'collections',     icon: 'credit-card', label: 'Payment Collections', desc: 'Payments collected for a date range' },
  { id: 'arrears',         icon: 'warning',     label: 'Arrears Aging',    desc: 'Overdue balances by 30/60/90+ days' },
  { id: 'maintenance',     icon: 'wrench',      label: 'Maintenance Costs', desc: 'Repair costs by property & category' },
  { id: 'occupancy',       icon: 'home',        label: 'Occupancy Report', desc: 'Vacancy rates & occupancy trends' },
  { id: 'tenant-ledger',   icon: 'users',       label: 'Tenant Ledger',    desc: 'Full payment history per tenant' },
];


function RentRollTable({ data }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {["Tenant", "Unit", "Property", "Rent", "Frequency", "Lease End", "Balance", "Status"].map(h => (
              <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(245,240,232,0.02)' }}>
              <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.white }}>{row.tenant}</td>
              <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.5)' }}>{row.unit}</td>
              <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)' }}>{row.property}</td>
              <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.white }}>{format(row.rent)}</td>
              <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)', textTransform: 'capitalize' }}>{row.frequency}</td>
              <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, fontSize: '0.68rem' }}>{formatDate(row.leaseEnd)}</td>
              <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: row.balance > 0 ? C.redLight : C.greenLight }}>{row.balance > 0 ? format(row.balance) : "Clear"}</td>
              <td style={{ padding: '0.55rem 0.8rem' }}>
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '3px',
                  fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: row.status === 'Active' ? C.greenLight : C.redLight,
                  background: row.status === 'Active' ? 'rgba(26,122,74,0.08)' : 'rgba(224,90,74,0.08)',
                  border: `1px solid ${row.status === 'Active' ? 'rgba(76,186,122,0.15)' : 'rgba(224,90,74,0.15)'}`,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.72rem' }}>
        <span style={{ color: 'rgba(245,240,232,0.4)' }}>
          {dateRange.from && dateRange.to ? `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}` : "All dates"}
        </span>
        <span style={{ fontWeight: 600, color: C.white }}>Total Collected: <span style={{ color: C.greenLight }}>{format(total)}</span></span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Tenant", "Unit", "Amount", "Due Date", "Date Paid", "Method", "Status"].map(h => (
                <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(245,240,232,0.25)' }}>No payments found for this period.</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(245,240,232,0.02)' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.white }}>{row.tenant}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.5)' }}>{row.unit}</td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.white }}>{format(row.amount)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, fontSize: '0.68rem' }}>{formatDate(row.due)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, fontSize: '0.68rem' }}>{row.paid ? formatDate(row.paid) : "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)' }}>{row.method || "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '3px',
                    fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: row.status === 'Paid' ? C.greenLight : row.status === 'Late' ? C.redLight : C.gold,
                    background: row.status === 'Paid' ? 'rgba(26,122,74,0.08)' : 'rgba(232,160,18,0.06)',
                    border: `1px solid ${row.status === 'Paid' ? 'rgba(76,186,122,0.15)' : 'rgba(232,160,18,0.12)'}`,
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
      {/* Summary Bands */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '1.2rem' }}>
        {[
          { label: '1-30 Days', value: bands['30'], color: C.gold },
          { label: '31-60 Days', value: bands['60'], color: '#f59e0b' },
          { label: '61-90 Days', value: bands['90'], color: C.redLight },
          { label: '90+ Days', value: bands['90plus'], color: C.redLight },
        ].map(band => (
          <div key={band.label} style={{ padding: '0.8rem', borderRadius: '4px', background: `${band.color}10`, border: `1px solid ${band.color}20`, textAlign: 'center' }}>
            <p style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{band.label}</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: band.color, fontFamily: F.bebas, marginTop: '2px' }}>{format(band.value)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Tenant", "Unit", "Property", "Balance", "Days Overdue", "Last Payment", "Status"].map(h => (
                <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(245,240,232,0.25)' }}>No arrears — all tenants are up to date!</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(245,240,232,0.02)' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.white }}>{row.tenant}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.5)' }}>{row.unit}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)' }}>{row.property}</td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.redLight }}>{format(row.balance)}</td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: row.daysOverdue > 60 ? C.redLight : C.gold }}>{row.daysOverdue}d</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, fontSize: '0.68rem' }}>{row.lastPayment ? formatDate(row.lastPayment) : "Never"}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '3px',
                    fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: row.collectionsStatus === 'collections' ? C.redLight : C.gold,
                    background: row.collectionsStatus === 'collections' ? 'rgba(224,90,74,0.08)' : 'rgba(232,160,18,0.06)',
                    border: `1px solid ${row.collectionsStatus === 'collections' ? 'rgba(224,90,74,0.15)' : 'rgba(232,160,18,0.12)'}`,
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

function MaintenanceCostTable({ data }) {
  const totalCost = data.reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const byProperty = {};
  data.forEach(r => {
    const prop = r.property || 'Unknown';
    byProperty[prop] = (byProperty[prop] || 0) + (Number(r.cost) || 0);
  });

  return (
    <div>
      {/* Property Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {Object.entries(byProperty).map(([prop, cost]) => (
          <div key={prop} style={{ padding: '0.7rem 0.9rem', borderRadius: '4px', background: C.black, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.4)' }}>{prop}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.gold, fontFamily: F.bebas }}>{format(cost)}</span>
          </div>
        ))}
        <div style={{ padding: '0.7rem 0.9rem', borderRadius: '4px', background: 'rgba(26,122,74,0.06)', border: '1px solid rgba(76,186,122,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.greenLight }}>Total</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.greenLight, fontFamily: F.bebas }}>{format(totalCost)}</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Request", "Property", "Category", "Priority", "Cost", "Date"].map(h => (
                <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(245,240,232,0.25)' }}>No maintenance costs recorded.</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(245,240,232,0.02)' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.white, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.title}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)' }}>{row.property}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)' }}>{row.category || "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '3px',
                    fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: row.priority === 'urgent' ? C.redLight : row.priority === 'high' ? C.gold : 'rgba(245,240,232,0.4)',
                    background: row.priority === 'urgent' ? 'rgba(224,90,74,0.08)' : 'rgba(245,240,232,0.04)',
                    border: `1px solid ${row.priority === 'urgent' ? 'rgba(224,90,74,0.15)' : C.border}`,
                  }}>{row.priority}</span>
                </td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.gold }}>{format(row.cost)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, fontSize: '0.68rem' }}>{formatDate(row.date)}</td>
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
        <p style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Overall Occupancy</p>
        <p style={{ fontSize: '2rem', fontWeight: 700, color: overallRate >= 80 ? C.greenLight : overallRate >= 50 ? C.gold : C.redLight, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{overallRate}%</p>
        <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)' }}>{totalOccupied} / {totalUnits} units occupied</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Property", "Total Units", "Occupied", "Vacant", "Maintenance", "Occupancy Rate"].map(h => (
                <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const rate = row.total > 0 ? Math.round((row.occupied / row.total) * 100) : 0;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(245,240,232,0.02)' }}>
                  <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.white }}>{row.property}</td>
                  <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.5)' }}>{row.total}</td>
                  <td style={{ padding: '0.55rem 0.8rem', color: C.greenLight, fontWeight: 600 }}>{row.occupied}</td>
                  <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)' }}>{row.vacant}</td>
                  <td style={{ padding: '0.55rem 0.8rem', color: C.gold }}>{row.maintenance || 0}</td>
                  <td style={{ padding: '0.55rem 0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: 5, borderRadius: '3px', background: 'rgba(245,240,232,0.06)', overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: 5, borderRadius: '3px', background: rate >= 80 ? C.greenLight : rate >= 50 ? C.gold : C.redLight, width: `${rate}%` }} />
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: C.white, fontFamily: F.mono }}>{rate}%</span>
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
  if (!selectedTenant) return <p style={{ textAlign: 'center', padding: '2rem', color: 'rgba(245,240,232,0.25)' }}>Select a tenant to view their ledger.</p>;

  const totalPaid = data.filter(p => p.status === 'Paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalOutstanding = data.filter(p => p.status !== 'Paid').reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.6rem 0.9rem', borderRadius: '3px', background: 'rgba(26,122,74,0.06)', border: '1px solid rgba(76,186,122,0.15)' }}>
          <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Total Paid</span>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: C.greenLight, fontFamily: F.bebas }}>{format(totalPaid)}</p>
        </div>
        <div style={{ padding: '0.6rem 0.9rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.15)' }}>
          <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Outstanding</span>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: C.redLight, fontFamily: F.bebas }}>{format(totalOutstanding)}</p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {["Period", "Amount", "Due Date", "Date Paid", "Method", "Status"].map(h => (
                <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(245,240,232,0.25)' }}>No payment history.</td></tr>
            )}
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(245,240,232,0.02)' }}>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 500, color: C.white }}>{row.period || "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600, color: C.white }}>{format(row.amount)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, fontSize: '0.68rem' }}>{formatDate(row.due)}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, fontSize: '0.68rem' }}>{row.paid ? formatDate(row.paid) : "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem', color: 'rgba(245,240,232,0.4)' }}>{row.method || "—"}</td>
                <td style={{ padding: '0.55rem 0.8rem' }}>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '3px',
                    fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: row.status === 'Paid' ? C.greenLight : C.redLight,
                    background: row.status === 'Paid' ? 'rgba(26,122,74,0.08)' : 'rgba(224,90,74,0.08)',
                    border: `1px solid ${row.status === 'Paid' ? 'rgba(76,186,122,0.15)' : 'rgba(224,90,74,0.15)'}`,
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
      
      // data is already an array from the backend
      setReportData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch report:", err);
      generateMockData();
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
          const tenantList = data.tenants || [];
          setTenants(tenantList);
        })
        .catch(() => {});
    }
  }, [fetchReport, activeReport]);

  function generateMockData() {
    const properties = ["Hillbrow Heights", "Berea Flats", "Yeoville Corner"];
    const tenants = ["Sipho Dlamini", "Lerato Mokoena", "Thabo Ndlovu", "Zandile Khumalo", "Michael Nkosi"];
    const units = ["Unit 101", "Unit 102", "Unit 201", "Unit 301", "Unit 202"];

    switch (activeReport) {
      case 'rent-roll':
        setReportData(tenants.map((t, i) => ({
          tenant: t, unit: units[i], property: properties[i % 3],
          rent: [5800, 6500, 4200, 7200, 3800][i], frequency: 'monthly',
          leaseEnd: new Date(2026, [3, 6, 9, 12, 5][i], [15, 30, 1, 20, 10][i]).toISOString(),
          balance: [0, 1500, 0, 0, 4200][i], status: [0, 2, 0, 0, 3].includes(i) ? 'Overdue' : 'Active',
        })));
        break;
      case 'collections':
        setReportData(Array.from({ length: 12 }, (_, i) => ({
          tenant: tenants[i % 5], unit: units[i % 5],
          amount: [5800, 6500, 4200, 7200, 5800, 6500, 4200, 7200, 5800, 6500, 4200, 7200][i],
          due: new Date(2026, 3, 1).toISOString(), paid: i < 9 ? new Date(2026, 3, [2, 5, 1, 3, 7, 1, 4, 2, 8][i]).toISOString() : null,
          method: ['EFT', 'Cash', 'EFT', 'EFT', 'Card', 'EFT', 'EFT', 'Cash', 'EFT'][i] || null,
          status: i < 9 ? 'Paid' : i < 11 ? 'Late' : 'Pending Approval',
        })));
        break;
      case 'arrears':
        setReportData([
          { tenant: "Zandile Khumalo", unit: "Unit 301", property: "Yeoville Corner", balance: 4200, daysOverdue: 75, lastPayment: new Date(2026, 1, 15).toISOString(), collectionsStatus: 'collections' },
          { tenant: "Michael Nkosi", unit: "Unit 202", property: "Berea Flats", balance: 1500, daysOverdue: 35, lastPayment: new Date(2026, 2, 20).toISOString(), collectionsStatus: 'overdue' },
          { tenant: "Thabo Ndlovu", unit: "Unit 102", property: "Hillbrow Heights", balance: 800, daysOverdue: 14, lastPayment: new Date(2026, 3, 1).toISOString(), collectionsStatus: 'overdue' },
        ]);
        break;
      case 'maintenance':
        setReportData([
          { title: "Burst pipe repair", property: "Hillbrow Heights", category: "Plumbing", priority: "urgent", cost: 3200, date: new Date(2026, 3, 5).toISOString() },
          { title: "DB Board upgrade", property: "Berea Flats", category: "Electrical", priority: "high", cost: 1800, date: new Date(2026, 2, 20).toISOString() },
          { title: "Ceiling leak fix", property: "Yeoville Corner", category: "Structural", priority: "medium", cost: 950, date: new Date(2026, 3, 10).toISOString() },
          { title: "Gate motor replacement", property: "Hillbrow Heights", category: "Security", priority: "high", cost: 4500, date: new Date(2026, 2, 15).toISOString() },
          { title: "Geyser repair", property: "Berea Flats", category: "Plumbing", priority: "urgent", cost: 2800, date: new Date(2026, 3, 1).toISOString() },
        ]);
        break;
      case 'occupancy':
        setReportData([
          { property: "Hillbrow Heights", total: 8, occupied: 7, vacant: 1, maintenance: 0 },
          { property: "Berea Flats", total: 6, occupied: 5, vacant: 0, maintenance: 1 },
          { property: "Yeoville Corner", total: 5, occupied: 4, vacant: 1, maintenance: 0 },
        ]);
        break;
      case 'tenant-ledger':
        if (selectedTenant) {
          setReportData(Array.from({ length: 8 }, (_, i) => ({
            period: `April 202${6 - Math.floor(i / 2)}`,
            amount: [5800, 5800, 6000, 6000, 6200, 6200, 6500, 6500][i],
            due: new Date(2026, 3 - i, 1).toISOString(),
            paid: i < 6 ? new Date(2026, 3 - i, [2, 1, 5, 3, 7, 1][i]).toISOString() : null,
            method: ['EFT', 'EFT', 'Cash', 'EFT', 'EFT', 'EFT'][i] || null,
            status: i < 6 ? 'Paid' : i < 7 ? 'Late' : 'Pending Approval',
          })));
        }
        break;
    }
  }

  function handleExport() {
    if (!reportData) return;
    let csv = '';
    const rows = Array.isArray(reportData) ? reportData : [];

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
    doc.setTextColor(10, 10, 10);
    doc.text(`${reportLabel} Report`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${date}`, 14, 28);
  
    let columns = [];
    let rows = [];
    
    switch (activeReport) {
      case 'rent-roll':
        columns = ['Tenant', 'Unit', 'Property', 'Rent', 'Frequency', 'Lease End', 'Balance', 'Status'];
        rows = reportData.map(r => [r.tenant, r.unit, r.property, format(r.rent), r.frequency, formatDate(r.leaseEnd), r.balance > 0 ? format(r.balance) : 'Clear', r.status]);
        break;
      case 'collections':
        columns = ['Tenant', 'Unit', 'Amount', 'Due Date', 'Date Paid', 'Method', 'Status'];
        rows = reportData.map(r => [r.tenant, r.unit, format(r.amount), formatDate(r.due), r.paid ? formatDate(r.paid) : '—', r.method || '—', r.status]);
        break;
      case 'arrears':
        columns = ['Tenant', 'Unit', 'Property', 'Balance', 'Days Overdue', 'Last Payment', 'Status'];
        rows = reportData.map(r => [r.tenant, r.unit, r.property, format(r.balance), `${r.daysOverdue}d`, r.lastPayment ? formatDate(r.lastPayment) : 'Never', r.collectionsStatus]);
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
    }
    
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [232, 160, 18],
        textColor: [10, 10, 10],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
  
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Chihwa Rentals - ${reportLabel} - Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`${reportLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exported!");
  }

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
    sectionTitle: { fontSize: '0.75rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .reports-grid { grid-template-columns: 1fr !important; } }
        @media print { .reports-sidebar, .reports-actions { display: none !important; } .reports-content { grid-column: 1 / -1 !important; } }
      `}</style>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={S.title}><Icon name="file-text" size={24} color={C.gold} />Reports</h1>
        <p style={S.subtitle}>Generate and export reports for your properties</p>
      </div>

      <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.2rem', alignItems: 'start' }}>
        
        {/* SIDEBAR */}
        <div className="reports-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {REPORT_TYPES.map(report => (
            <div key={report.id} onClick={() => { setActiveReport(report.id); setReportData(null); setSelectedTenant(null); }} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.7rem', padding: '0.8rem 1rem',
              cursor: 'pointer', borderRadius: '4px',
              background: activeReport === report.id ? 'rgba(232,160,18,0.06)' : 'transparent',
              border: `1px solid ${activeReport === report.id ? C.gold : 'transparent'}`,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (activeReport !== report.id) e.currentTarget.style.background = C.muted; }}
              onMouseLeave={e => { if (activeReport !== report.id) e.currentTarget.style.background = 'transparent'; }}>
              <Icon name={report.icon} size={16} color={activeReport === report.id ? C.gold : 'rgba(245,240,232,0.35)'} style={{ marginTop: '1px' }} />
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: activeReport === report.id ? 600 : 400, color: activeReport === report.id ? C.gold : C.white }}>{report.label}</p>
                <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '2px' }}>{report.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="reports-content">
          {/* Toolbar */}
          <div className="reports-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Date filters for payment reports */}
              {(activeReport === 'collections' || activeReport === 'maintenance') && (
                <>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                  <span style={{ color: 'rgba(245,240,232,0.3)' }}>to</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
                  <button onClick={fetchReport} style={{ ...btnGhost, padding: '0.45rem 0.8rem', fontSize: '0.7rem' }}>Apply</button>
                </>
              )}

              {/* Tenant selector for tenant ledger */}
              {activeReport === 'tenant-ledger' && (
                <select value={selectedTenant?.id || ""} onChange={e => {
                  const t = tenants.find(tn => tn.id === e.target.value);
                  setSelectedTenant(t || null);
                }} style={{ ...selectStyle, width: 220 }}>
                  <option value="">Select a tenant...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name} — {t.unit_number ? `Unit ${t.unit_number}` : t.property_name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={handleExport} disabled={!reportData} style={{ ...btnPrimary, opacity: reportData ? 1 : 0.4, cursor: reportData ? 'pointer' : 'not-allowed' }}>
                <Icon name="download" size={13} /> Export CSV
              </button>
              <button onClick={handleExportPDF} disabled={!reportData} style={{ ...btnGhost, opacity: reportData ? 1 : 0.4, cursor: reportData ? 'pointer' : 'not-allowed' }}>
                <Icon name="download" size={13} /> Export PDF
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div style={cardStyle}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={S.sectionTitle}>
                <Icon name={activeReportConfig?.icon} size={16} color={C.gold} />
                {activeReportConfig?.label}
              </h3>
            </div>

            <div style={{ padding: '1.2rem 1.5rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(245,240,232,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  Generating report...
                </div>
              ) : reportData ? (
                <>
                  {activeReport === 'rent-roll' && <RentRollTable data={reportData} />}
                  {activeReport === 'collections' && <CollectionsTable data={reportData} dateRange={{ from: dateFrom, to: dateTo }} />}
                  {activeReport === 'arrears' && <ArrearsTable data={reportData} />}
                  {activeReport === 'maintenance' && <MaintenanceCostTable data={reportData} />}
                  {activeReport === 'occupancy' && <OccupancyTable data={reportData} />}
                  {activeReport === 'tenant-ledger' && <TenantLedgerTable data={reportData} selectedTenant={selectedTenant} />}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(245,240,232,0.2)' }}>
                  <p>Select a report type and configure filters, then click Apply.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}