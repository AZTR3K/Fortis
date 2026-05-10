import Sidebar from "./Sidebar";

export default function Shell({ children }) {
  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
