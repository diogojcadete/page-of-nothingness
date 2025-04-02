import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Edit, CheckCircle, AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";
import TaskCard from "@/components/tasks/TaskCard";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ProjectRole, Collaborator, Task } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const SprintBoard: React.FC = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const { updateSprint, updateTask, refreshProjectData } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sprint, setSprint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [columns, setColumns] = useState<{[key: string]: {title: string, taskIds: string[]}}>(
    {
      "todo": { title: "TO DO", taskIds: [] },
      "in-progress": { title: "IN PROGRESS", taskIds: [] },
      "done": { title: "DONE", taskIds: [] }
    }
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(["todo", "in-progress", "done"]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskMap, setTaskMap] = useState<{[key: string]: any}>({});
  const [projectId, setProjectId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  
  // Function to refresh board data
  const refreshBoardData = async () => {
    if (!sprintId) return;
    
    try {
      console.log("Refreshing sprint board data for sprint ID:", sprintId);
        
      const { data: sprintData, error: sprintError } = await supabase
        .from('sprints')
        .select('*')
        .eq('id', sprintId)
        .single();
        
      if (sprintError) {
        console.error("Error fetching sprint:", sprintError);
        throw sprintError;
      }
      
      if (!sprintData) {
        console.error("Sprint not found");
        throw new Error('Sprint not found');
      }
      
      console.log("Sprint data fetched:", sprintData);
      setSprint(sprintData);
      setProjectId(sprintData.project_id);
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('sprint_id', sprintId);
        
      if (tasksError) throw tasksError;
      
      console.log("Tasks data fetched:", tasksData || []);
      
      // Create a task map for quick lookups
      const newTaskMap: {[key: string]: any} = {};
      (tasksData || []).forEach(task => {
        newTaskMap[task.id] = task;
      });
      
      setTaskMap(newTaskMap);
      setTasks(tasksData || []);
      
      const initialColumns: {[key: string]: {title: string, taskIds: string[]}} = {
        "todo": { title: "TO DO", taskIds: [] },
        "in-progress": { title: "IN PROGRESS", taskIds: [] },
        "done": { title: "DONE", taskIds: [] }
      };
      
      tasksData?.forEach(task => {
        if (initialColumns[task.status]) {
          initialColumns[task.status].taskIds.push(task.id);
        } else {
          initialColumns.todo.taskIds.push(task.id);
        }
      });
      
      setColumns(initialColumns);
      
    } catch (error) {
      console.error('Error refreshing board data:', error);
      toast.error("Failed to refresh board data");
    }
  };
  
  useEffect(() => {
    const fetchSprintData = async () => {
      if (!sprintId) return;
      
      try {
        setIsLoading(true);
        console.log("Fetching sprint data for sprint ID:", sprintId);
        
        const { data: sprintData, error: sprintError } = await supabase
          .from('sprints')
          .select('*')
          .eq('id', sprintId)
          .single();
          
        if (sprintError) {
          console.error("Error fetching sprint:", sprintError);
          throw sprintError;
        }
        
        if (!sprintData) {
          console.error("Sprint not found");
          throw new Error('Sprint not found');
        }
        
        console.log("Sprint data fetched:", sprintData);
        setSprint(sprintData);
        setProjectId(sprintData.project_id);
        
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('sprint_id', sprintId);
          
        if (tasksError) throw tasksError;
        
        console.log("Tasks data fetched:", tasksData || []);
        
        // Create a task map for quick lookups
        const taskMap: {[key: string]: any} = {};
        (tasksData || []).forEach(task => {
          taskMap[task.id] = task;
        });
        
        setTaskMap(taskMap);
        setTasks(tasksData || []);
        
        const initialColumns: {[key: string]: {title: string, taskIds: string[]}} = {
          "todo": { title: "TO DO", taskIds: [] },
          "in-progress": { title: "IN PROGRESS", taskIds: [] },
          "done": { title: "DONE", taskIds: [] }
        };
        
        tasksData?.forEach(task => {
          if (initialColumns[task.status]) {
            initialColumns[task.status].taskIds.push(task.id);
          } else {
            initialColumns.todo.taskIds.push(task.id);
          }
        });
        
        setColumns(initialColumns);
        
        if (user) {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select('owner_id')
            .eq('id', sprintData.project_id)
            .single();
            
          if (projectError) {
            console.error("Error fetching project:", projectError);
          } else if (projectData && projectData.owner_id === user.id) {
            console.log("User is project owner");
            setIsOwner(true);
            setUserRole('scrum_master');
          } else {
            const { data: collaboratorData, error: collaboratorError } = await supabase
              .from('collaborators')
              .select('role')
              .eq('project_id', sprintData.project_id)
              .eq('user_id', user.id)
              .single();
              
            if (collaboratorError) {
              console.error("Error checking collaborator status:", collaboratorError);
            } else if (collaboratorData) {
              console.log("User is a collaborator with role:", collaboratorData.role);
              setUserRole(collaboratorData.role as ProjectRole);
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching sprint data:', error);
        setIsLoading(false);
      }
    };
    
    fetchSprintData();
  }, [sprintId, user]);

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId && 
      destination.index === source.index
    ) {
      return;
    }
    
    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    
    if (source.droppableId === destination.droppableId) {
      const newTaskIds = Array.from(sourceColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      
      const newColumn = {
        ...sourceColumn,
        taskIds: newTaskIds,
      };
      
      setColumns({
        ...columns,
        [source.droppableId]: newColumn,
      });
    } 
    else {
      const sourceTaskIds = Array.from(sourceColumn.taskIds);
      sourceTaskIds.splice(source.index, 1);
      
      const destTaskIds = Array.from(destColumn.taskIds);
      destTaskIds.splice(destination.index, 0, draggableId);
      
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          taskIds: sourceTaskIds,
        },
        [destination.droppableId]: {
          ...destColumn,
          taskIds: destTaskIds,
        },
      });
      
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: destination.droppableId })
          .eq('id', draggableId);
          
        if (error) throw error;
        
        // Update the task in tasks array and taskMap
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === draggableId ? { ...task, status: destination.droppableId } : task
          )
        );
        
        setTaskMap(prevMap => ({
          ...prevMap,
          [draggableId]: { ...prevMap[draggableId], status: destination.droppableId }
        }));
        
        try {
          await updateTask(draggableId, {
            status: destination.droppableId
          });
          
          // Refresh project data in context to keep everything in sync
          if (projectId && destination.droppableId === 'done') {
            await refreshProjectData(projectId);
          }
        } catch (contextError) {
          console.log("Context update failed but Supabase update succeeded:", contextError);
        }
      } catch (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to update task status");
        
        setColumns({
          ...columns,
          [source.droppableId]: {
            ...sourceColumn,
            taskIds: Array.from(sourceColumn.taskIds),
          },
          [destination.droppableId]: {
            ...destColumn,
            taskIds: Array.from(destColumn.taskIds).filter(id => id !== draggableId),
          },
        });
      }
    }
  };
  
  const handleTaskDeleted = (taskId: string) => {
    // First remove from columns
    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      
      Object.keys(newColumns).forEach(columnId => {
        const column = newColumns[columnId];
        const taskIndex = column.taskIds.indexOf(taskId);
        
        if (taskIndex !== -1) {
          newColumns[columnId] = {
            ...column,
            taskIds: column.taskIds.filter(id => id !== taskId)
          };
        }
      });
      
      return newColumns;
    });
    
    // Remove from tasks array
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    // Remove from task map
    setTaskMap(prevMap => {
      const newMap = { ...prevMap };
      delete newMap[taskId];
      return newMap;
    });
  };
  
  const handleTaskUpdated = (updatedTask: any) => {
    console.log("Task update received in SprintBoard:", updatedTask);
    setIsUpdatingTask(true);

    try {
      // First, update the tasks state with the new task data
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => 
          task.id === updatedTask.id ? {
            ...task,
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            assignedTo: updatedTask.assign_to,
            assign_to: updatedTask.assign_to,
            storyPoints: updatedTask.story_points,
            story_points: updatedTask.story_points,
            priority: updatedTask.priority,
            completionDate: updatedTask.completion_date,
            completion_date: updatedTask.completion_date
          } : task
        );
        console.log("Updated tasks array:", updatedTasks);
        return updatedTasks;
      });
      
      // Update the task map
      setTaskMap(prevMap => ({
        ...prevMap,
        [updatedTask.id]: {
          ...prevMap[updatedTask.id],
          title: updatedTask.title,
          description: updatedTask.description,
          status: updatedTask.status,
          assignedTo: updatedTask.assign_to,
          assign_to: updatedTask.assign_to,
          storyPoints: updatedTask.story_points,
          story_points: updatedTask.story_points,
          priority: updatedTask.priority,
          completionDate: updatedTask.completion_date,
          completion_date: updatedTask.completion_date
        }
      }));
      
      // Then update the columns state to ensure the task appears in the correct column
      setColumns(prevColumns => {
        // Create a deep copy of the columns
        const newColumns = JSON.parse(JSON.stringify(prevColumns));
        
        // Find which column currently contains the task
        let currentColumnId: string | null = null;
        let foundInColumn = false;
        
        Object.keys(newColumns).forEach(columnId => {
          if (newColumns[columnId].taskIds.includes(updatedTask.id)) {
            currentColumnId = columnId;
            foundInColumn = true;
          }
        });

        console.log(`Task ${updatedTask.id} found in column: ${currentColumnId}, new status: ${updatedTask.status}`);
        
        // If the task's status has changed, move it to the new column
        if (currentColumnId && currentColumnId !== updatedTask.status) {
          // Remove from current column
          newColumns[currentColumnId].taskIds = newColumns[currentColumnId].taskIds.filter(
            (id: string) => id !== updatedTask.id
          );
          
          // Add to new column if it exists
          if (newColumns[updatedTask.status]) {
            newColumns[updatedTask.status].taskIds.push(updatedTask.id);
          } else {
            // Default to todo if the status doesn't match a column
            newColumns.todo.taskIds.push(updatedTask.id);
          }
        } 
        // If task wasn't found in any column, add it to the appropriate column
        else if (!foundInColumn) {
          const targetColumn = updatedTask.status && newColumns[updatedTask.status] 
            ? updatedTask.status 
            : 'todo';
            
          newColumns[targetColumn].taskIds.push(updatedTask.id);
        }
        
        console.log("Updated columns state:", newColumns);
        return newColumns;
      });
      
      // If task was marked as done, refresh project data to update burndown charts
      if (updatedTask.status === 'done' && projectId) {
        refreshProjectData(projectId);
      }
    } catch (error) {
      console.error("Error updating task in UI:", error);
      toast.error("There was a problem updating the task. Refreshing data.");
      refreshBoardData();
    } finally {
      setIsUpdatingTask(false);
    }
  };
  
  const handleCompleteSprint = async () => {
    if (!isOwner && userRole !== 'scrum_master') {
      toast.error("Only project owners and admins can complete sprints");
      return;
    }

    if (!allTasksCompleted) {
      setIsCompleteDialogOpen(true);
      return;
    }
    
    await completeSprintAction();
  };
  
  const completeSprintAction = async () => {
    try {
      const { error } = await supabase
        .from('sprints')
        .update({ status: 'completed' })
        .eq('id', sprint.id);
        
      if (error) throw error;
      
      setSprint({ ...sprint, status: 'completed' });
      toast.success("Sprint marked as completed!");
      
      // Immediately refresh project data to update burndown charts and timelines
      if (projectId) {
        await refreshProjectData(projectId);
      }
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Failed to complete sprint");
    }
  };
  
  const confirmCompleteSprint = async () => {
    try {
      await completeSprintAction();
      setIsCompleteDialogOpen(false);
    } catch (error) {
      console.error("Error completing sprint:", error);
      toast.error("Failed to complete sprint");
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">Loading sprint...</div>
      </div>
    );
  }
  
  if (!sprint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Sprint not found</h2>
        <p className="text-scrum-text-secondary mb-4">
          Either the sprint doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="scrum-button"
        >
          Go Back
        </button>
      </div>
    );
  }

  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.status === "done");

  return (
    <div className="container mx-auto pb-20 px-4">
      <SprintHeader 
        sprint={sprint}
        onCompleteSprint={handleCompleteSprint}
        allTasksCompleted={allTasksCompleted}
        canComplete={isOwner || userRole === 'scrum_master'}
      />
      
      <div className="flex items-center justify-between mb-4 mt-8">
        <h3 className="text-lg font-medium">Sprint Board</h3>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 pb-4 overflow-x-auto">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            
            if (!column) return null;
            
            const columnTasks = column.taskIds
              .map(taskId => taskMap[taskId] || tasks.find(task => task.id === taskId))
              .filter(Boolean);
            
            return (
              <div key={columnId} className="min-w-[270px] max-w-[270px] flex-shrink-0">
                <div className="bg-scrum-card border border-scrum-border rounded-md h-full flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b border-scrum-border">
                    <h4 className="font-medium text-sm">{column.title}</h4>
                    <div className="text-xs text-scrum-text-secondary">{columnTasks.length}</div>
                  </div>
                  
                  <Droppable droppableId={columnId} isDropDisabled={sprint.status === "completed" || userRole === 'product_owner'}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 flex-1 min-h-[300px] overflow-y-auto ${snapshot.isDraggingOver ? "bg-scrum-accent/10" : ""}`}
                      >
                        {columnTasks.map((task, index) => (
                          task && (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                              isDragDisabled={sprint.status === "completed" || userRole === 'product_owner' || isUpdatingTask}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 transition-transform duration-200 ${snapshot.isDragging ? "scale-105 shadow-lg opacity-90 z-10" : ""}`}
                                >
                                  <TaskCard
                                    task={task}
                                    onEdit={(isOwner || userRole === 'scrum_master' || userRole === 'team_member') ? () => setEditingTask(task.id) : undefined}
                                    isSprintCompleted={sprint.status === "completed"}
                                    onTaskDeleted={handleTaskDeleted}
                                  />
                                </div>
                              )}
                            </Draggable>
                          )
                        ))}
                        {provided.placeholder}
                        
                        {columnTasks.length === 0 && (
                          <div className="text-center py-4 text-scrum-text-secondary text-sm italic">
                            No tasks
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      
      {editingTask && (
        <EditTaskModal
          taskId={editingTask}
          onClose={() => {
            setEditingTask(null);
            refreshBoardData(); // Refresh data when modal closes
          }}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
      
      {isCompleteDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-md animate-fade-up">
            <div className="mb-6 flex items-start gap-3">
              <AlertTriangle className="text-yellow-500 h-5 w-5 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Complete Sprint</h3>
                <p className="text-scrum-text-secondary">
                  Not all tasks are in the "DONE" column. Do you still want to complete this sprint?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsCompleteDialogOpen(false)}
                className="scrum-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmCompleteSprint}
                className="scrum-button-warning"
              >
                Complete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SprintHeaderProps {
  sprint: {
    id: string;
    title: string;
    description?: string;
    project_id: string;
    start_date: string;
    end_date: string;
    status: 'planned' | 'in-progress' | 'completed';
  };
  onCompleteSprint: () => void;
  allTasksCompleted: boolean;
  canComplete: boolean;
}

const SprintHeader: React.FC<SprintHeaderProps> = ({ 
  sprint, 
  onCompleteSprint,
  allTasksCompleted,
  canComplete
}) => {
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };
  
  return (
    <div className="flex items-center justify-between p-4 border-b border-scrum-border">
      <div>
        <h1 className="font-bold text-xl">{sprint.title}</h1>
        <div className="text-sm text-scrum-text-secondary">
          {formatDateRange(sprint.start_date, sprint.end_date)}
        </div>
      </div>
      
      <div>
        {sprint.status !== "completed" && canComplete && (
          <button
            onClick={onCompleteSprint}
            className={`flex items-center gap-1 ${allTasksCompleted ? 'scrum-button-success' : 'scrum-button-warning'}`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Complete Sprint</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SprintBoard;
