import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ErrorScreen, LoadingScreen } from "./components/Common";
import { useAtlasData } from "./lib/useAtlasData";
import AboutPage from "./pages/AboutPage";
import CompareSamplesPage from "./pages/CompareSamplesPage";
import LandingPage from "./pages/LandingPage";
import MethodsPage from "./pages/MethodsPage";
import SampleAtlasPage from "./pages/SampleAtlasPage";
import SampleDetailPage from "./pages/SampleDetailPage";
import UploadGuidePage from "./pages/UploadGuidePage";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/samples", label: "Sample Atlas" },
  { to: "/compare", label: "Compare Samples" },
  { to: "/methods", label: "Methods" },
  { to: "/upload-guide", label: "Data Upload Guide" },
  { to: "/about", label: "About" },
];

export default function App() {
  const { data, error, loading } = useAtlasData();

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand-lockup" to="/">
          <span className="brand-mark">DA</span>
          <span>
            <strong>Drift Atlas</strong>
            <small>Powder Characterisation Atlas</small>
          </span>
        </NavLink>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        {loading ? <LoadingScreen /> : null}
        {error ? <ErrorScreen message={error} /> : null}
        {data ? (
          <Routes>
            <Route path="/" element={<LandingPage data={data} />} />
            <Route path="/samples" element={<SampleAtlasPage data={data} />} />
            <Route path="/samples/:sampleId" element={<SampleDetailPage data={data} />} />
            <Route path="/compare" element={<CompareSamplesPage data={data} />} />
            <Route path="/methods" element={<MethodsPage data={data} />} />
            <Route path="/upload-guide" element={<UploadGuidePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : null}
      </main>
    </div>
  );
}
