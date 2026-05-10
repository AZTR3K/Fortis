import { NavLink } from "react-router-dom";
import { LayoutDashboard, Activity, Zap } from "lucide-react";

const navItems = [{ to: "/", icon: LayoutDashboard, label: "Squad" }];

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex flex-col h-screen border-r shrink-0"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Wordmark */}
      <div
        className="flex items-center gap-2 px-4 py-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <Zap size={16} className="text-blue-500" fill="currentColor" />
        <span className="text-white font-semibold tracking-widest text-sm">FORTIS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? "bg-white/5 text-white" : "text-gray-500 hover:text-gray-300"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Coming soon */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 cursor-not-allowed">
          <Activity size={16} />
          Analytics
          <span className="ml-auto text-xs text-gray-700">soon</span>
        </div>
      </nav>

      {/* API status */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-gray-500">API Connected</span>
        </div>
      </div>
    </aside>
  );
}
