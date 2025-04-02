import React, { useState, useEffect } from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import NavLink from "@/components/ui/NavLink";
import { ArrowLeft, LayoutGrid, List, LineChart, Edit, Trash, Package, Users } from "lucide-react";
import { toast } from "sonner";
import { fetchProjectCollaborators } from "@/lib/supabase";
import { Collaborator, ProjectRole } from "@/types";

const ProjectLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, deleteProject } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const project = getProject(projectId || "");
  
  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!project || !user) {
        setIsLoading(false);
        return;
      }
      
      // Check if user is owner
      if (project.ownerId === user.id) {
        setIsOwner(true);
        setUserRole('scrum_master'); // Owner has admin privileges
        setIsLoading(false);
        return;
      }
      
      // Otherwise check collaborator role
      try {
        const collaborators = await fetchProjectCollaborators(project.id);
        const userCollaboration = collaborators.find(c => c.userId === user.id);
        
        if (userCollaboration) {
          setUserRole(userCollaboration.role);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking project access:", error);
        setIsLoading(false);
      }
    };
    
    checkProjectAccess();
  }, [project, user]);
  
  const { setIsOwner: setAuthIsOwner, setUserRole: setAuthUserRole } = useAuth() as any;
  
  useEffect(() => {
    if (setAuthIsOwner && setAuthUserRole) {
      setAuthIsOwner(isOwner);
      setAuthUserRole(userRole);
    }
  }, [isOwner, userRole, setAuthIsOwner, setAuthUserRole]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading project details...</div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <button 
            onClick={() => navigate("/")}
            className="scrum-button"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(project.id);
        toast.success("Project deleted successfully");
        navigate("/");
      } catch (error) {
        toast.error("Failed to delete project");
        console.error(error);
      }
    }
  };
  
  // Only project owners and scrum masters can edit the project
  const canEditProject = isOwner || userRole === 'scrum_master';
  
  // Scrum Masters, Team Members and Product Owners can access backlog
  const canAccessBacklog = isOwner || userRole === 'scrum_master' || userRole === 'team_member' || userRole === 'product_owner';
  
  // Only owners and scrum masters can modify sprints
  const canModifySprints = isOwner || userRole === 'scrum_master';
  
  const handleBackToProjects = () => {
    if (project.isCollaboration) {
      navigate("/", { state: { activeTab: "collaborations" } });
    } else {
      navigate("/", { state: { activeTab: "projects" } });
    }
  };

  // Check if we're on the edit page
  const isEditPage = location.pathname.endsWith('/edit');
  
  // If we're on the edit page, just render the outlet
  if (isEditPage) {
    return <Outlet />;
  }
  
  return (
    <div className="pt-16 min-h-screen animate-fade-in">
      <div className="px-6 py-4">
        <button 
          onClick={handleBackToProjects}
          className="flex items-center gap-1 text-scrum-text-secondary hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </button>
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {project.title}
              {canEditProject && (
                <>
                  <button 
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                    className="text-scrum-text-secondary hover:text-white transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="text-scrum-text-secondary hover:text-destructive transition-colors"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </>
              )}
            </h1>
            <p className="text-scrum-text-secondary">{project.description}</p>
          </div>
        </div>
        
        {project.endGoal && (
          <div className="mb-4">
            <p className="text-xs text-scrum-text-secondary">End goal:</p>
            <p>{project.endGoal}</p>
          </div>
        )}
        
        <div className="flex gap-2 mb-4 bg-scrum-card rounded-md border border-scrum-border p-1 w-fit">
          <NavLink to={`/projects/${project.id}`} end={true}>
            <LayoutGrid className="h-4 w-4 mr-1" />
            <span>Sprints</span>
          </NavLink>
          
          {canAccessBacklog && (
            <NavLink to={`/projects/${project.id}/backlog`}>
              <Package className="h-4 w-4 mr-1" />
              <span>Product Backlog</span>
            </NavLink>
          )}
          
          <NavLink to={`/projects/${project.id}/timeline`}>
            <List className="h-4 w-4 mr-1" />
            <span>Timeline</span>
          </NavLink>
          
          <NavLink to={`/projects/${project.id}/burndown`}>
            <LineChart className="h-4 w-4 mr-1" />
            <span>Burndown Chart</span>
          </NavLink>
          
          <NavLink to={`/projects/${project.id}/team`}>
            <Users className="h-4 w-4 mr-1" />
            <span>Team</span>
          </NavLink>
          
          {isOwner && (
            <NavLink to={`/projects/${project.id}/collaborators`}>
              <Users className="h-4 w-4 mr-1" />
              <span>Collaborators</span>
            </NavLink>
          )}
        </div>
        
        {userRole && !isOwner && (
          <div className="text-xs text-scrum-text-secondary mb-2">
            You have {userRole === 'product_owner' ? 'Product Owner' : 
                      userRole === 'team_member' ? 'Team Member' : 
                      userRole === 'scrum_master' ? 'Scrum Master' : userRole} access to this project
          </div>
        )}
      </div>
      
      <main className="px-6 py-2 pb-20">
        <Outlet />
      </main>
    </div>
  );
};

export default ProjectLayout;
