// src/layouts/GlassLayout.jsx
import { Outlet, NavLink, useLocation } from "react-router-dom";
import BackgroundFX from "../shared/BackgroundFX";

const btn = {
  background: "rgba(255,255,255,.08)",
  border: "1px solid rgba(255,255,255,.2)",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 999,
  textDecoration: "none",
};

export default function GlassLayout() {
  const { pathname } = useLocation();
  // Показываем верхнее меню только на странице "Наша миссия"
  const showTopNav = pathname.startsWith("/mission");

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        overflow: "hidden",
        background: "#0f172a",
      }}
    >
      <BackgroundFX />

      {showTopNav && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            zIndex: 40,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 16,
              color: "rgba(255,255,255,.85)",
            }}
          >
            <nav style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
              <NavLink to="/" style={btn}>
                Страны
              </NavLink>
              <NavLink to="/mission" style={btn}>
                Наша миссия
              </NavLink>
              <NavLink to="/mission" style={btn}>
                Кто мы и что делаем?
              </NavLink>
            </nav>
          </div>
        </div>
      )}

      {/* сюда рендерятся страницы */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}
