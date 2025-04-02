
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchCollaborativeProjects } from "@/lib/supabase";
import { CollaborativeProject } from "@/types";
import { Users, User, Shield, Eye } from "lucide-react";

const Collaborations: React.FC = () => {
  const [collaborativeProjects, setCollaborativeProjects] = useState<CollaborativeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadCollaborativeProjects = async () => {
      if (!user) return;
      
      try {
        const projects = await fetchCollaborativeProjects(user.id);
        // Ensure projects have all required fields from CollaborativeProject type
        const typedProjects: CollaborativeProject[] = projects.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description || '',
          endGoal: project.endGoal,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          ownerId: project.ownerId,
          ownerName: project.ownerName || '',
          isCollaboration: true,
          role: project.role
        }));
        setCollaborativeProjects(typedProjects);
      } catch (error) {
        console.error("Error loading collaborative projects:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCollaborativeProjects();
  }, [user]);
  
  const getRoleBadge = (role: string) => {
    let color = "";
    let icon = null;
    
    switch (role) {
      case "scrum_master":
        color = "bg-destructive/80 text-white";
        icon = <Shield className="h-3 w-3" />;
        break;
      case "team_member":
        color = "bg-blue-500/80 text-white";
        icon = <User className="h-3 w-3" />;
        break;
      case "product_owner":
        color = "bg-scrum-accent/80 text-white";
        icon = <Eye className="h-3 w-3" />;
        break;
    }
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${color}`}>
        {icon}
        {role === 'product_owner' ? 'Product Owner' : 
         role === 'team_member' ? 'Team Member' : 
         role === 'scrum_master' ? 'Scrum Master' : role}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 animate-fade-in">
        <div className="container px-6 py-8">
          <div className="text-center py-12 animate-pulse">
            Loading collaborative projects...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 animate-fade-in">
      <div className="container px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-scrum-text-secondary" />
          <h1 className="text-2xl font-bold">My Collaborations</h1>
        </div>
        
        <p className="text-scrum-text-secondary mb-6">
          Projects shared with you by other users.
        </p>
        
        {collaborativeProjects.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-scrum-text-secondary opacity-50" />
            <p className="text-scrum-text-secondary">
              You don't have any collaborative projects yet. 
              Other users can share their projects with you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collaborativeProjects.map(project => (
              <div 
                key={project.id} 
                className="scrum-card hover:border-scrum-highlight animate-fade-up cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold">{project.title}</h3>
                    {getRoleBadge(project.role)}
                  </div>
                  
                  <p className="text-scrum-text-secondary text-sm mb-4">{project.description}</p>
                  
                  {project.endGoal && (
                    <div>
                      <p className="text-xs text-scrum-text-secondary">End goal:</p>
                      <p className="text-sm">{project.endGoal}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-scrum-border">
                  <p className="text-xs text-scrum-text-secondary">
                    Owned by <span className="font-medium">{project.ownerName}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collaborations;
