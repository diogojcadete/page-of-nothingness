
import React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  
  const formattedDate = project.createdAt
    ? format(new Date(project.createdAt), "M/d/yyyy")
    : "";
  
  return (
    <div className="scrum-card hover:border-scrum-highlight animate-fade-up">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1">{project.title}</h3>
        <p className="text-scrum-text-secondary text-sm mb-4">{project.description}</p>
        
        {project.endGoal && (
          <div>
            <p className="text-xs text-scrum-text-secondary">End goal:</p>
            <p className="text-sm">{project.endGoal}</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-scrum-text-secondary">{formattedDate}</span>
        <button
          onClick={() => navigate(`/projects/${project.id}`)}
          className="scrum-button"
        >
          Open Project
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
