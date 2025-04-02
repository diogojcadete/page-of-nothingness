import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import SprintCard from "@/components/sprints/SprintCard";
import NewSprintButton from "@/components/sprints/NewSprintButton";
import { X, Edit } from "lucide-react";
import { toast } from "sonner";
import { fetchProjectCollaborators, fetchCollaborativeProjectSprints, supabase } from "@/lib/supabase";
import { ProjectRole } from "@/types";

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getSprintsByProject, getSprint, updateSprint } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [editingSprint, setEditingSprint] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"planned" | "in-progress" | "completed">("planned");
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);
  const [sprints, setSprints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const project = getProject(projectId || "");
  
  // Fetch sprints directly from Supabase
  useEffect(() => {
    const fetchSprints = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      
      try {
        // For all projects (owned or collaborative), fetch sprints directly from the database
        console.log("Fetching sprints for project:", projectId);
        const { data, error } = await supabase
          .from('sprints')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching sprints:", error);
          throw error;
        }
        
        console.log("Fetched sprints:", data);
        if (data) {
          setSprints(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching sprints:", error);
        // Fallback to local sprints if database fetch fails
        const localSprints = getSprintsByProject(projectId);
        setSprints(localSprints);
        setIsLoading(false);
      }
    };
    
    fetchSprints();
  }, [projectId, getSprintsByProject]);
  
  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!project || !user) return;
      
      // Check if user is owner
      if (project.ownerId === user.id) {
        setIsOwner(true);
        setUserRole('scrum_master'); // Owner has scrum master privileges
        return;
      }
      
      // Otherwise check collaborator role
      try {
        const collaborators = await fetchProjectCollaborators(project.id);
        const userCollaboration = collaborators.find(c => c.userId === user.id);
        
        if (userCollaboration) {
          setUserRole(userCollaboration.role);
        }
      } catch (error) {
        console.error("Error checking project access:", error);
      }
    };
    
    checkProjectAccess();
  }, [project, user]);
  
  const handleEditClick = (sprintId: string) => {
    // Find the sprint in the fetched sprints array first
    const sprintToEdit = sprints.find(s => s.id === sprintId);
    
    if (sprintToEdit) {
      setTitle(sprintToEdit.title);
      setDescription(sprintToEdit.description || "");
      setStartDate(sprintToEdit.start_date); // Note: database uses snake_case
      setEndDate(sprintToEdit.end_date);     // Note: database uses snake_case
      setStatus(sprintToEdit.status);
      setEditingSprint(sprintId);
    } else {
      // Fallback to the local sprint if not found in fetched sprints
      const sprint = getSprint(sprintId);
      if (sprint) {
        setTitle(sprint.title);
        setDescription(sprint.description);
        setStartDate(sprint.startDate);
        setEndDate(sprint.endDate);
        setStatus(sprint.status);
        setEditingSprint(sprintId);
      }
    }
  };
  
  const handleUpdateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSprint) return;
    
    try {
      await updateSprint(editingSprint, {
        title,
        description,
        startDate,
        endDate,
        status,
      });
      
      toast.success("Sprint updated successfully");
      setEditingSprint(null);
    } catch (error) {
      toast.error("Failed to update sprint");
      console.error(error);
    }
  };
  
  const handleViewSprintBoard = (sprintId: string) => {
    navigate(`/projects/${project.id}/sprint/${sprintId}`);
  };
  
  // Refresh sprints after creating a new one
  const handleSprintsRefresh = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setSprints(data);
      }
    } catch (error) {
      console.error("Error refreshing sprints:", error);
    }
  };
  
  // Check if user can modify sprints (scrum_master or owner)
  const canModifySprints = isOwner || userRole === 'scrum_master';
  const isOwnerOrAdmin = isOwner || userRole === 'scrum_master';
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">Loading sprints...</div>
      </div>
    );
  }
  
  // Redirect if project not found
  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Project not found</h2>
        <button
          onClick={() => navigate("/")}
          className="scrum-button"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Sprints</h2>
        {projectId && canModifySprints && (
          <NewSprintButton projectId={projectId} />
        )}
      </div>

      {sprints.length === 0 ? (
        <div className="text-center py-12 bg-scrum-card border border-scrum-border rounded-lg">
          <p className="text-scrum-text-secondary mb-4">No sprints created yet</p>
          {projectId && canModifySprints && (
            <div className="flex justify-center">
              <NewSprintButton projectId={projectId} />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={{
                id: sprint.id,
                title: sprint.title,
                description: sprint.description || "",
                startDate: sprint.start_date || sprint.startDate, // Support both formats
                endDate: sprint.end_date || sprint.endDate,       // Support both formats
                status: sprint.status,
                projectId: sprint.project_id || sprint.projectId
              }}
              onEdit={canModifySprints ? () => handleEditClick(sprint.id) : undefined}
              onViewBoard={() => handleViewSprintBoard(sprint.id)}
              isOwnerOrAdmin={isOwnerOrAdmin}
              canEdit={canModifySprints}
            />
          ))}
        </div>
      )}
      
      {/* Edit Sprint Modal */}
      {editingSprint && canModifySprints && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>Edit Sprint</span>
              </h2>
              <button
                onClick={() => setEditingSprint(null)}
                className="text-scrum-text-secondary hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSprint}>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm">
                  Sprint Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="scrum-input"
                  required
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
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 text-sm">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="scrum-input"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-sm">
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="scrum-input"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block mb-2 text-sm">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="scrum-input"
                >
                  <option value="planned">Planned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSprint(null)}
                    className="scrum-button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="scrum-button"
                  >
                    Update Sprint
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
