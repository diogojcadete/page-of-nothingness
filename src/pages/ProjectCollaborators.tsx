
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import AddCollaboratorForm from "@/components/collaborations/AddCollaboratorForm";
import CollaboratorsList from "@/components/collaborations/CollaboratorsList";
import { Users } from "lucide-react";

const ProjectCollaborators: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject } = useProjects();
  const [refresh, setRefresh] = useState(0);
  
  const project = getProject(projectId || "");
  
  const handleCollaboratorChange = () => {
    setRefresh(prev => prev + 1);
  };
  
  if (!project) {
    return (
      <div className="text-center py-8">
        Project not found
      </div>
    );
  }
  
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-indigo-500" />
        <h2 className="text-2xl font-bold">Project Collaborators</h2>
      </div>
      
      <p className="text-scrum-text-secondary mb-6">
        Invite team members to collaborate on this project with different roles.
      </p>
      
      <div className="mb-8">
        <AddCollaboratorForm 
          projectId={project.id} 
          onCollaboratorAdded={handleCollaboratorChange}
        />
      </div>
      
      <div>
        <CollaboratorsList 
          key={refresh} 
          projectId={project.id} 
          onCollaboratorsChange={handleCollaboratorChange}
        />
      </div>
    </div>
  );
};

export default ProjectCollaborators;
