import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SampleExplorer from "./pages/SampleExplorer";
import PSDExplorer from "./pages/PSDExplorer";
import KFExplorer from "./pages/KFExplorer";
import GranuTapExplorer from "./pages/GranuTapExplorer";
import GranuDrumExplorer from "./pages/GranuDrumExplorer";
import SEMExplorer from "./pages/SEMExplorer";
import AZtecExplorer from "./pages/AZtecExplorer";
import CorrelationExplorer from "./pages/CorrelationExplorer";
import ComparisonTool from "./pages/ComparisonTool";

const NAV: [string, string][] = [
  ["/", "Dashboard"],
  ["/samples", "Samples"],
  ["/psd", "PSD"],
  ["/kf", "KF Moisture"],
  ["/granutap", "GranuTap"],
  ["/granudrum", "GranuDrum"],
  ["/sem", "SEM Images"],
  ["/aztec", "AZtecFeature"],
  ["/correlation", "Correlation"],
  ["/compare", "Comparison"],
];

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="brand">🌀 Drift Atlas</h1>
        <nav>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
        <footer>Static · GitHub Pages · no backend</footer>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/samples" element={<SampleExplorer />} />
          <Route path="/psd" element={<PSDExplorer />} />
          <Route path="/kf" element={<KFExplorer />} />
          <Route path="/granutap" element={<GranuTapExplorer />} />
          <Route path="/granudrum" element={<GranuDrumExplorer />} />
          <Route path="/sem" element={<SEMExplorer />} />
          <Route path="/aztec" element={<AZtecExplorer />} />
          <Route path="/correlation" element={<CorrelationExplorer />} />
          <Route path="/compare" element={<ComparisonTool />} />
        </Routes>
      </main>
    </div>
  );
}
