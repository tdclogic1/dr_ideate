import { useState } from "react";
import "./theme/theme.css";
import { IdeasPanel } from "./components/IdeasPanel";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { PreferencesPanel } from "./components/PreferencesPanel";
import { SourcesPanel } from "./components/SourcesPanel";

type Tab = "ideas" | "favorites" | "preferences" | "sources";
const TABS: { id: Tab; label: string }[] = [
  { id: "ideas", label: "Ideas" },
  { id: "favorites", label: "Favorites" },
  { id: "preferences", label: "Preferences" },
  { id: "sources", label: "Blogs & sources" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("ideas");
  return (
    <div className="ideate-shell">
      <header className="ideate-header">
        <div>
          <h1>dr_ideate</h1>
          <p className="ideate-tagline">Live trend research, filtered through your preferences, turned into video ideas.</p>
        </div>
        <nav className="ideate-tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? "is-active" : ""}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {tab === "ideas" && <IdeasPanel onGoToPreferences={() => setTab("preferences")} />}
        {tab === "favorites" && <FavoritesPanel />}
        {tab === "preferences" && <PreferencesPanel />}
        {tab === "sources" && <SourcesPanel />}
      </main>
    </div>
  );
}
