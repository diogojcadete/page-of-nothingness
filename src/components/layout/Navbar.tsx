
import React from "react";
import { Link } from "react-router-dom";
import { LogOut, Check, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-scrum-card border-b border-scrum-border px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <Check className="h-6 w-6 text-white" />
          <h1 className="text-xl font-semibold text-white">Scrumify Hub</h1>
        </Link>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-scrum-text-secondary">{user.email}</span>
          <Link 
            to="/settings" 
            className="text-scrum-text-secondary hover:text-white transition-colors"
            title="User Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <div className="h-8 w-8 rounded-full bg-white text-scrum-card flex items-center justify-center font-semibold">
            {user.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <button
            onClick={logout}
            className="text-scrum-text-secondary hover:text-white transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
