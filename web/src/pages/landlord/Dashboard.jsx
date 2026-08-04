// LANDLORD DASHBOARD — Placeholder
import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function Dashboard() {
  useDocumentTitle("Dashboard");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      background: "#0D0D0D",
      margin: "-1rem -1.8rem",
    }}>
      <h1 style={{
        fontSize: "3rem",
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: ".08em",
        color: "rgba(245,240,232,0.12)",
        textTransform: "uppercase",
        userSelect: "none",
      }}>
        Dashboard
      </h1>
    </div>
  );
}