
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Check } from "lucide-react";
import { toast } from "sonner";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("All fields are required");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      await register(username, email, password);
      toast.success("Account created successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
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
          <h2 className="text-2xl font-bold mb-6">Create Account</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="scrum-input"
                placeholder="Choose a username"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="scrum-input"
                placeholder="Enter your email"
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
                placeholder="Create a password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="scrum-button w-full"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-scrum-text-secondary">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
