
import React from "react";
import { format } from "date-fns";
import { Sprint } from "@/types";
import { CalendarDays, Edit } from "lucide-react";

interface SprintCardProps {
  sprint: Sprint;
  onEdit?: () => void;
  onViewBoard?: () => void;
  isOwnerOrAdmin?: boolean;
  canEdit?: boolean;
}

const SprintCard: React.FC<SprintCardProps> = ({ 
  sprint, 
  onEdit = () => {}, 
  onViewBoard = () => {},
  isOwnerOrAdmin = false,
  canEdit = false 
}) => {
  const getStatusColor = () => {
    switch (sprint.status) {
      case "completed":
        return "bg-success text-white";
      case "in-progress":
        return "bg-blue-500 text-white";
      default:
        return "bg-scrum-accent text-white";
    }
  };
  
  return (
    <div className={`scrum-card relative ${sprint.status === "completed" ? "border-green-500/30" : ""}`}>
      {sprint.status === "completed" && (
        <div className="absolute top-2 right-2">
          <span className="bg-success text-white text-xs px-2 py-1 rounded-full">
            Completed
          </span>
        </div>
      )}
      
      <h3 className="text-xl font-bold mb-2">{sprint.title}</h3>
      <p className="text-scrum-text-secondary mb-4 line-clamp-2">{sprint.description}</p>
      
      <div className="flex items-center gap-2 text-scrum-text-secondary mb-4">
        <CalendarDays className="h-4 w-4" />
        <span className="text-sm">
          {format(new Date(sprint.startDate), "MMM d, yyyy")} - {format(new Date(sprint.endDate), "MMM d, yyyy")}
        </span>
      </div>
      
      <div className="flex items-center justify-between gap-2 mt-4">
        {canEdit && (
          <button
            onClick={onEdit}
            className="scrum-button-secondary flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
        )}
        
        <button
          onClick={onViewBoard}
          className={`scrum-button ${!canEdit ? 'w-full' : ''}`}
        >
          View Board
        </button>
      </div>
    </div>
  );
};

export default SprintCard;
