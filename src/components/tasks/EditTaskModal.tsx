
import React, { useState, useEffect, useMemo } from "react";
import { useProjects } from "@/context/ProjectContext";
import { X, Edit, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ProjectRole, Collaborator } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface EditTaskModalProps {
  taskId: string;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: any) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ 
  taskId,
  onClose,
  onTaskUpdated
}) => {
  const [task, setTask] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [storyPoints, setStoryPoints] = useState<number>(1);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [projectOwner, setProjectOwner] = useState<{id: string, username: string} | null>(null);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [completionDate, setCompletionDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<string>("todo");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { getTask, updateTask } = useProjects();
  
  useEffect(() => {
    async function loadTaskData() {
      try {
        console.log("Loading task data for task ID:", taskId);
        
        // Try to get task from context first
        const contextTask = getTask(taskId);
        
        if (contextTask) {
          console.log("Task found in context:", contextTask);
          initializeTaskState(contextTask);
          setProjectId(contextTask.projectId);
          
          if (contextTask.projectId) {
            fetchCollaborators(contextTask.projectId);
          }
        } else {
          // Fallback to fetching from Supabase
          console.log("Task not found in context, fetching from Supabase");
          
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();
            
          if (error) {
            console.error("Error fetching task data:", error);
            throw error;
          }
          
          if (data) {
            console.log("Task fetched from Supabase:", data);
            initializeTaskState(data);
            setProjectId(data.project_id);
            
            if (data.project_id) {
              fetchCollaborators(data.project_id);
            }
          } else {
            throw new Error("Task not found");
          }
        }
      } catch (error) {
        console.error("Error loading task data:", error);
        toast.error("Failed to load task data");
        onClose();
      }
    }
    
    loadTaskData();
  }, [taskId, getTask, onClose]);
  
  const initializeTaskState = (taskData: any) => {
    setTask(taskData);
    setTitle(taskData.title || "");
    setDescription(taskData.description || "");
    setPriority(taskData.priority || "medium");
    setAssignedTo(taskData.assignedTo || taskData.assign_to || "");
    setStoryPoints(taskData.storyPoints || taskData.story_points || 1);
    setStatus(taskData.status || "todo");
    
    const dateStr = taskData.completionDate || taskData.completion_date;
    if (dateStr) {
      try {
        setCompletionDate(parseISO(dateStr));
      } catch (err) {
        console.error("Error parsing date:", err);
      }
    }
    
    setIsInitialized(true);
  };
  
  const fetchCollaborators = async (projectId: string) => {
    setIsLoadingCollaborators(true);
    try {
      const [projectResponse, collaboratorsResponse] = await Promise.all([
        supabase
          .from('projects')
          .select('owner_id, title')
          .eq('id', projectId)
          .single(),
          
        supabase
          .from('collaborators')
          .select(`
            id,
            userId:user_id,
            role,
            createdAt:created_at,
            users:user_id (
              id,
              username,
              email
            )
          `)
          .eq('project_id', projectId)
      ]);
      
      if (!projectResponse.error && projectResponse.data) {
        const ownerResponse = await supabase
          .from('users')
          .select('id, username')
          .eq('id', projectResponse.data.owner_id)
          .single();
          
        if (!ownerResponse.error && ownerResponse.data) {
          setProjectOwner(ownerResponse.data);
        }
      }
      
      if (!collaboratorsResponse.error && collaboratorsResponse.data) {
        const formattedCollaborators = collaboratorsResponse.data.map(collab => ({
          id: collab.id,
          userId: collab.userId,
          username: collab.users ? (collab.users as any).username || '' : '',
          email: collab.users ? (collab.users as any).email || '' : '',
          role: collab.role as ProjectRole,
          createdAt: collab.createdAt
        }));
        
        setCollaborators(formattedCollaborators);
      }
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    } finally {
      setIsLoadingCollaborators(false);
    }
  };
  
  const assigneeOptions = useMemo(() => {
    const options = [];
    
    if (projectOwner) {
      options.push({ id: projectOwner.id, name: projectOwner.username });
    }
    
    options.push(...collaborators.map(collab => ({ 
      id: collab.userId,
      name: collab.username 
    })));
    
    return options;
  }, [projectOwner, collaborators]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const updatedData = {
        title,
        description,
        priority,
        assignedTo,
        storyPoints,
        status,
        completionDate: completionDate ? format(completionDate, "yyyy-MM-dd") : null
      };
      
      console.log("Updating task with data:", updatedData);
      
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          status: updatedData.status,
          assign_to: updatedData.assignedTo,
          story_points: updatedData.storyPoints,
          priority: updatedData.priority,
          completion_date: updatedData.completionDate
        })
        .eq('id', taskId)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating task in Supabase:", error);
        throw error;
      }
      
      console.log("Task updated in Supabase:", updatedTask);
      
      // Also update task in context
      await updateTask(taskId, updatedData);
      
      // If consumer provided a callback, call it with the updated task
      if (onTaskUpdated && updatedTask) {
        console.log("Calling onTaskUpdated with:", updatedTask);
        onTaskUpdated(updatedTask);
      }
      
      toast.success("Task updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <button
              onClick={onClose}
              className="text-scrum-text-secondary hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-14 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span>Edit Task</span>
          </h2>
          <button
            onClick={onClose}
            className="text-scrum-text-secondary hover:text-white"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm">
              Task Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="scrum-input"
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="scrum-input"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 text-sm">
                Priority <span className="text-destructive">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="scrum-input"
                required
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">
                Story Points <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={storyPoints}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setStoryPoints(isNaN(value) ? 1 : Math.max(1, value));
                }}
                className="scrum-input"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2 text-sm">
                Status <span className="text-destructive">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="scrum-input"
                required
                disabled={isSubmitting}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 text-sm">
                Completion Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`scrum-input flex justify-between items-center text-left font-normal ${!completionDate && "text-muted-foreground"}`}
                    disabled={isSubmitting}
                  >
                    {completionDate ? format(completionDate, "PPP") : "Select date"}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={completionDate}
                    onSelect={setCompletionDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm">
              Assigned To
            </label>
            {isLoadingCollaborators ? (
              <div className="scrum-input flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              assigneeOptions.length > 0 ? (
                <Select 
                  value={assignedTo} 
                  onValueChange={setAssignedTo}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-scrum-background border-scrum-border text-scrum-text focus:ring-scrum-accent focus:border-scrum-border">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent className="bg-scrum-card border-scrum-border">
                    {assigneeOptions.map(option => (
                      <SelectItem 
                        key={option.id} 
                        value={option.name}
                        className="text-scrum-text focus:bg-scrum-accent/20 focus:text-scrum-text"
                      >
                        <div className="flex items-center">
                          <User className="h-3.5 w-3.5 mr-2 text-scrum-text-secondary" />
                          {option.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="scrum-input"
                  placeholder="Enter name or email"
                  disabled={isSubmitting}
                />
              )
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="scrum-button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="scrum-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
