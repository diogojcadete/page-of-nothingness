
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Check } from "lucide-react";
import { toast } from "sonner";

const Login: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailOrUsername.trim() || !password.trim()) {
      toast.error("All fields are required");
      return;
    }
    
    setLoading(true);
    try {
      await login(emailOrUsername, password);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-scrum-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-start w-full mb-8">
          <Link to="/" className="flex items-center gap-2">
            <Check className="h-6 w-6 text-white" />
            <h1 className="text-xl font-semibold text-white">Scrumify Hub</h1>
          </Link>
        </div>
        
        <div className="bg-scrum-card border border-scrum-border rounded-lg p-8 w-full">
          <h2 className="text-2xl font-bold mb-6">Sign In</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm">
                Email or Username
              </label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="scrum-input"
                placeholder="Enter your email or username"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 text-sm">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="scrum-input"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="scrum-button w-full"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-scrum-text-secondary">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
