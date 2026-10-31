
import { Outlet } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="app-shell">
      {/* Website Header */}
      <Header />

      {/* Main Page Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Website Footer */}
      <Footer />
    </div>
  );
}
