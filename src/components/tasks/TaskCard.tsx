
import React from "react";
import { useProjects } from "@/context/ProjectContext";
import { Edit, Trash, AlertTriangle, Star, Hash, User, Calendar } from "lucide-react";
import { Task } from "@/types";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface TaskCardProps {
  task: Task;
  onEdit?: () => void;
  isSprintCompleted?: boolean;
  onTaskDeleted?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  isSprintCompleted = false, 
  onTaskDeleted 
}) => {
  const { deleteTask } = useProjects();

  // Improved null safety with optional chaining and defaults
  const safeTask = {
    ...task,
    id: task?.id || '',
    title: task?.title || 'Untitled Task',
    description: task?.description || '',
    priority: task?.priority || '',
    storyPoints: task?.storyPoints !== undefined ? task.storyPoints : (task?.story_points || 0),
    story_points: task?.story_points !== undefined ? task.story_points : (task?.storyPoints || 0),
    assignedTo: task?.assignedTo || task?.assign_to || '',
    assign_to: task?.assign_to || task?.assignedTo || '',
    completionDate: task?.completionDate || task?.completion_date || null,
    completion_date: task?.completion_date || task?.completionDate || null,
  };

  const getPriorityBadge = () => {
    if (!safeTask.priority) return null;
    
    let color = "";
    let icon = null;
    
    switch (safeTask.priority) {
      case "high":
        color = "bg-destructive/80 text-white";
        icon = <AlertTriangle className="h-3 w-3" />;
        break;
      case "medium":
        color = "bg-orange-500/80 text-white";
        icon = <Star className="h-3 w-3" />;
        break;
      case "low":
        color = "bg-blue-500/80 text-white";
        break;
      default:
        return null;
    }
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${color}`}>
        {icon}
        {safeTask.priority.charAt(0).toUpperCase() + safeTask.priority.slice(1)}
      </span>
    );
  };
  
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(safeTask.id);
        
        // Notify parent component that task has been deleted
        if (onTaskDeleted) {
          onTaskDeleted(safeTask.id);
        }
        
        toast.success("Task deleted successfully");
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
      }
    }
  };
  
  // Get story points from appropriate property
  const storyPoints = safeTask.storyPoints;
  
  // Get assignee from appropriate property
  const assignee = safeTask.assignedTo;
  
  // Get completion date from appropriate property with better logging
  const completionDate = safeTask.completionDate;
  
  return (
    <div className="bg-scrum-background border border-scrum-border rounded-md p-3 hover:border-scrum-highlight transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2">{safeTask.title}</h4>
        
        {!isSprintCompleted && onEdit && (
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={onEdit}
              className="text-scrum-text-secondary hover:text-white transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="text-scrum-text-secondary hover:text-destructive transition-colors"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {safeTask.description && (
        <p className="text-scrum-text-secondary text-xs mb-2 line-clamp-2">
          {safeTask.description}
        </p>
      )}
      
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {getPriorityBadge()}
        
        {/* Display story points if they exist */}
        {storyPoints !== undefined && storyPoints !== null && (
          <span className="bg-scrum-accent/30 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {storyPoints} {storyPoints === 1 ? "point" : "points"}
          </span>
        )}
        
        {/* Display assignee if it exists */}
        {assignee && (
          <span className="bg-scrum-card text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <User className="h-3 w-3" />
            {assignee}
          </span>
        )}
        
        {/* Display completion date if it exists */}
        {completionDate && (
          <span className="bg-green-700/30 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(parseISO(completionDate), "MMM d, yyyy")}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
