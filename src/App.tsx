
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProjectProvider } from "@/context/ProjectContext";

// Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectLayout from "./components/layout/ProjectLayout";
import ProjectDetail from "./pages/ProjectDetail";
import BurndownChart from "./pages/BurndownChart";
import SprintBoard from "./pages/SprintBoard";
import EditSprint from "./pages/EditSprint";
import ProjectTimeline from "./pages/ProjectTimeline";
import NotFound from "./pages/NotFound";
import ProductBacklog from "./pages/ProductBacklog";
import ProjectCollaborators from "./pages/ProjectCollaborators";
import ProjectTeam from "./pages/ProjectTeam";
import EditProject from "./pages/EditProject";
import UserSettings from "./pages/UserSettings";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Public route that redirects to dashboard if authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProjectProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
              
              {/* Project routes */}
              <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectLayout /></ProtectedRoute>}>
                <Route index element={<ProjectDetail />} />
                <Route path="backlog" element={<ProductBacklog />} />
                <Route path="timeline" element={<ProjectTimeline />} />
                <Route path="burndown" element={<BurndownChart />} />
                <Route path="collaborators" element={<ProjectCollaborators />} />
                <Route path="team" element={<ProjectTeam />} />
                <Route path="sprint/:sprintId" element={<SprintBoard />} />
                <Route path="sprint/:sprintId/edit" element={<EditSprint />} />
                <Route path="edit" element={<EditProject />} />
              </Route>
              
              {/* Sprint routes */}
              <Route path="/sprints/:sprintId" element={<ProtectedRoute><SprintBoard /></ProtectedRoute>} />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProjectProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
