import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Project, Sprint, Task, BurndownData } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase, withRetry } from "@/lib/supabase";
import { toast } from "sonner";

interface ProjectContextType {
  projects: Project[];
  sprints: Sprint[];
  tasks: Task[];
  burndownData: Record<string, BurndownData[]>;
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<Project>;
  getProject: (id: string) => Project | undefined;
  updateProject: (id: string, project: Partial<Omit<Project, "id">>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  addSprint: (sprint: Omit<Sprint, "id">) => Promise<Sprint>;
  getSprint: (id: string) => Sprint | undefined;
  updateSprint: (id: string, sprint: Partial<Omit<Sprint, "id">>) => Promise<Sprint>;
  deleteSprint: (id: string) => Promise<void>;
  getSprintsByProject: (projectId: string) => Sprint[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<Task>;
  getTask: (id: string) => Task | undefined;
  updateTask: (id: string, task: Partial<Omit<Task, "id">>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTasksBySprint: (sprintId: string) => Task[];
  getBacklogTasks: (projectId: string) => Task[];
  getBurndownData: (projectId: string) => BurndownData[];
  fetchCollaborativeProjects: () => Promise<void>;
  refreshProjectData: (projectId?: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  sprints: [],
  tasks: [],
  burndownData: {},
  addProject: async () => ({ id: "", title: "", description: "", createdAt: "", updatedAt: "" }),
  getProject: () => undefined,
  updateProject: async () => ({ id: "", title: "", description: "", createdAt: "", updatedAt: "" }),
  deleteProject: async () => {},
  addSprint: async () => ({ id: "", title: "", description: "", projectId: "", startDate: "", endDate: "", status: "planned" }),
  getSprint: () => undefined,
  updateSprint: async () => ({ id: "", title: "", description: "", projectId: "", startDate: "", endDate: "", status: "planned" }),
  deleteSprint: async () => {},
  getSprintsByProject: () => [],
  addTask: async () => ({ id: "", title: "", sprintId: "", status: "todo", createdAt: "", updatedAt: "" }),
  getTask: () => undefined,
  updateTask: async () => ({ id: "", title: "", sprintId: "", status: "todo", createdAt: "", updatedAt: "" }),
  deleteTask: async () => {},
  getTasksBySprint: () => [],
  getBacklogTasks: () => [],
  getBurndownData: () => [],
  fetchCollaborativeProjects: async () => {},
  refreshProjectData: async () => {},
});

export const useProjects = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [burndownData, setBurndownData] = useState<Record<string, BurndownData[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Record<string, number>>({});
  const [fetchErrors, setFetchErrors] = useState<Record<string, boolean>>({});

  const shouldRefetch = useCallback((key: string, maxAge = 60000) => {
    const now = Date.now();
    const lastFetch = lastFetchTime[key] || 0;
    return now - lastFetch > maxAge;
  }, [lastFetchTime]);

  const updateFetchTime = useCallback((key: string) => {
    setLastFetchTime(prev => ({...prev, [key]: Date.now()}));
    setFetchErrors(prev => ({...prev, [key]: false}));
  }, []);

  const markFetchError = useCallback((key: string) => {
    setFetchErrors(prev => ({...prev, [key]: true}));
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchCollaborativeProjects();
    } else {
      setProjects([]);
      setSprints([]);
      setTasks([]);
      setBurndownData({});
    }
  }, [user]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const fetchProjects = async () => {
    if (!user || isLoading) return;
    
    if (!shouldRefetch('projects') && projects.length > 0 && !fetchErrors['projects']) {
      console.log('Using cached projects data');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('projects')
          .select(`*, owner:owner_id (username, email)`)
          .eq('owner_id', user.id);
      });

      if (error) throw error;

      if (data) {
        const formattedProjects: Project[] = data.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description || '',
          endGoal: project.end_goal,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          ownerId: project.owner_id,
          ownerName: project.owner?.username || '',
          ownerEmail: project.owner?.email || '',
          isCollaboration: false
        }));

        setProjects(formattedProjects);
        updateFetchTime('projects');
        
        for (const project of formattedProjects) {
          await fetchSprints(project.id);
          await delay(500);
          await fetchBacklogTasks(project.id);
          await delay(500);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      markFetchError('projects');
      toast.error("Failed to load projects. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSprints = async (projectId: string, forceRefresh = false) => {
    if (!user) return;
    
    const cacheKey = `sprints-${projectId}`;
    if (!forceRefresh && !shouldRefetch(cacheKey) && sprints.some(s => s.projectId === projectId) && !fetchErrors[cacheKey]) {
      console.log(`Using cached sprints data for project ${projectId}`);
      return;
    }

    try {
      console.log(`Fetching sprints for project: ${projectId}`);
      
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('sprints')
          .select('*')
          .eq('project_id', projectId);
      });

      if (error) throw error;

      console.log(`Fetched sprints:`, data);

      if (data) {
        const formattedSprints: Sprint[] = data.map(sprint => ({
          id: sprint.id,
          title: sprint.title,
          description: sprint.description || '',
          projectId: sprint.project_id,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
          status: sprint.status as 'planned' | 'in-progress' | 'completed'
        }));

        setSprints(prev => {
          const filtered = prev.filter(s => s.projectId !== projectId);
          return [...filtered, ...formattedSprints];
        });
        updateFetchTime(cacheKey);
        
        for (const sprint of formattedSprints) {
          await fetchTasksBySprint(sprint.id, forceRefresh);
          await delay(300);
        }
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
      markFetchError(cacheKey);
    }
  };

  const fetchTasksBySprint = async (sprintId: string, forceRefresh = false) => {
    if (!user) return;
    
    const cacheKey = `tasks-sprint-${sprintId}`;
    if (!forceRefresh && !shouldRefetch(cacheKey) && tasks.some(t => t.sprintId === sprintId) && !fetchErrors[cacheKey]) {
      console.log(`Using cached tasks data for sprint ${sprintId}`);
      return;
    }

    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('tasks')
          .select('*')
          .eq('sprint_id', sprintId);
      });

      if (error) throw error;

      if (data) {
        const formattedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          sprintId: task.sprint_id || '',
          status: task.status,
          assignedTo: task.assign_to,
          storyPoints: task.story_points,
          priority: task.priority as 'low' | 'medium' | 'high',
          createdAt: task.created_at,
          updatedAt: task.created_at,
          projectId: task.project_id,
          completionDate: task.completion_date
        }));

        setTasks(prev => {
          const filtered = prev.filter(t => t.sprintId !== sprintId);
          return [...filtered, ...formattedTasks];
        });
        updateFetchTime(cacheKey);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      markFetchError(cacheKey);
    }
  };

  const fetchBacklogTasks = async (projectId: string, forceRefresh = false) => {
    if (!user) return;
    
    const cacheKey = `backlog-${projectId}`;
    if (!forceRefresh && !shouldRefetch(cacheKey) && tasks.some(t => t.projectId === projectId && t.status === 'backlog' && !t.sprintId) && !fetchErrors[cacheKey]) {
      console.log(`Using cached backlog data for project ${projectId}`);
      return;
    }

    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('tasks')
          .select('*')
          .is('sprint_id', null)
          .eq('project_id', projectId)
          .eq('status', 'backlog');
      });

      if (error) throw error;

      if (data) {
        const formattedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          sprintId: '',
          status: 'backlog',
          assignedTo: task.assign_to,
          storyPoints: task.story_points,
          priority: task.priority as 'low' | 'medium' | 'high',
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          projectId: task.project_id,
          completionDate: task.completion_date
        }));

        setTasks(prev => {
          const filtered = prev.filter(t => 
            !(t.status === 'backlog' && t.projectId === projectId && !t.sprintId)
          );
          return [...filtered, ...formattedTasks];
        });
        updateFetchTime(cacheKey);
      }
    } catch (error) {
      console.error('Error fetching backlog tasks:', error);
      markFetchError(cacheKey);
    }
  };

  const refreshProjectData = async (projectId?: string) => {
    if (!user) return;
    
    console.log(`Refreshing project data${projectId ? ` for project: ${projectId}` : ' for all projects'}`);
    
    try {
      if (projectId) {
        const projectCacheKeys = [
          `sprints-${projectId}`,
          `backlog-${projectId}`
        ];
        
        const newFetchTime = {...lastFetchTime};
        projectCacheKeys.forEach(key => delete newFetchTime[key]);
        setLastFetchTime(newFetchTime);
        
        await fetchSprints(projectId, true);
        await fetchBacklogTasks(projectId, true);
        
        const projectSprints = sprints.filter(s => s.projectId === projectId);
        for (const sprint of projectSprints) {
          const sprintKey = `tasks-sprint-${sprint.id}`;
          delete newFetchTime[sprintKey];
          await fetchTasksBySprint(sprint.id, true);
        }
        
        toast.success("Project data refreshed successfully");
      } else {
        setLastFetchTime({});
        await fetchProjects();
        await fetchCollaborativeProjects();
        
        toast.success("All data refreshed successfully");
      }
    } catch (error) {
      console.error("Error refreshing project data:", error);
      toast.error("Failed to refresh project data");
    }
  };

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const addProject = async (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title: project.title,
          description: project.description,
          end_goal: project.endGoal,
          owner_id: user.id
        }])
        .select(`*, owner:owner_id (username, email)`)
        .single();

      if (error) throw error;

      if (!data) throw new Error('Failed to create project');

      const newProject: Project = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        endGoal: data.end_goal,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        ownerId: data.owner_id,
        ownerName: data.owner?.username || '',
        isCollaboration: false
      };

      setProjects(prev => [...prev, newProject]);
      
      setBurndownData(prev => ({
        ...prev,
        [newProject.id]: generateDefaultBurndownData(),
      }));
      
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const getProject = (id: string) => projects.find((p) => p.id === id);

  const updateProject = async (id: string, project: Partial<Omit<Project, "id">>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: project.title,
          description: project.description,
          end_goal: project.endGoal,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      const updatedProject = {
        ...projects.find((p) => p.id === id)!,
        ...project,
        updatedAt: new Date().toISOString(),
      };

      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const projectSprints = sprints.filter(s => s.projectId === id);
      const sprintIds = projectSprints.map(s => s.id);
      
      console.log(`Attempting to delete project ${id} with ${sprintIds.length} sprints`);
      
      for (const sprintId of sprintIds) {
        try {
          await deleteSprint(sprintId);
        } catch (error) {
          console.error(`Error deleting sprint ${sprintId}:`, error);
          throw error;
        }
      }
      
      const { error: backlogTasksError } = await supabase
        .from('tasks')
        .delete()
        .is('sprint_id', null)
        .eq('project_id', id);
        
      if (backlogTasksError) {
        console.error('Error deleting backlog tasks:', backlogTasksError);
        throw backlogTasksError;
      }
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      setSprints(prev => prev.filter(s => s.projectId !== id));
      setTasks(prev => prev.filter(t => !sprintIds.includes(t.sprintId) && t.projectId !== id));
      
      setBurndownData(prev => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
      
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error("Failed to delete project");
      throw error;
    }
  };

  const addSprint = async (sprint: Omit<Sprint, "id">) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('sprints')
        .insert([{
          title: sprint.title,
          description: sprint.description,
          project_id: sprint.projectId,
          start_date: sprint.startDate,
          end_date: sprint.endDate,
          status: sprint.status,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      if (!data) throw new Error('Failed to create sprint');

      const newSprint: Sprint = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        projectId: data.project_id,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status as 'planned' | 'in-progress' | 'completed'
      };

      setSprints(prev => [...prev, newSprint]);
      
      await refreshProjectData(sprint.projectId);
      
      return newSprint;
    } catch (error) {
      console.error('Error adding sprint:', error);
      throw error;
    }
  };

  const getSprint = (id: string) => sprints.find((s) => s.id === id);

  const updateSprint = async (id: string, sprint: Partial<Omit<Sprint, "id">>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const existingSprint = sprints.find(s => s.id === id);
      if (!existingSprint) throw new Error('Sprint not found');
      
      const projectId = existingSprint.projectId;
      
      const isCompletingStatus = existingSprint.status !== 'completed' && sprint.status === 'completed';

      const { error } = await supabase
        .from('sprints')
        .update({
          title: sprint.title,
          description: sprint.description,
          start_date: sprint.startDate,
          end_date: sprint.endDate,
          status: sprint.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      const updatedSprint = {
        ...existingSprint,
        ...sprint,
      };

      setSprints(prev => prev.map(s => s.id === id ? updatedSprint : s));
      
      if (isCompletingStatus && projectId) {
        console.log(`Sprint ${id} marked as completed, refreshing project ${projectId} data`);
        await refreshProjectData(projectId);
      }
      
      return updatedSprint;
    } catch (error) {
      console.error('Error updating sprint:', error);
      throw error;
    }
  };

  const deleteSprint = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log(`Attempting to delete sprint ${id}`);
      
      const targetSprint = sprints.find(s => s.id === id);
      const projectId = targetSprint?.projectId;
      
      console.log("Deleting board columns for sprint:", id);
      const { data: columnsData, error: columnsQueryError } = await supabase
        .from('board_columns')
        .select('id')
        .eq('sprint_id', id);
        
      if (columnsQueryError) {
        console.error('Error querying sprint board columns:', columnsQueryError);
        throw columnsQueryError;
      }
      
      if (columnsData && columnsData.length > 0) {
        console.log(`Found ${columnsData.length} board columns to delete`);
        
        for (const column of columnsData) {
          const { error: columnDeleteError } = await supabase
            .from('board_columns')
            .delete()
            .eq('id', column.id);
            
          if (columnDeleteError) {
            console.error(`Error deleting column ${column.id}:`, columnDeleteError);
            throw columnDeleteError;
          }
        }
      } else {
        console.log("No board columns found for this sprint");
      }

      console.log("Deleting tasks for sprint:", id);
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('sprint_id', id);
        
      if (tasksError) {
        console.error('Error deleting sprint tasks:', tasksError);
        throw tasksError;
      }

      console.log("Deleting sprint:", id);
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting sprint:', error);
        throw error;
      }

      setSprints(prev => prev.filter(s => s.id !== id));
      setTasks(prev => prev.filter(t => t.sprintId !== id));
      toast.success("Sprint deleted successfully");
      
      if (projectId) {
        await refreshProjectData(projectId);
      }
      
    } catch (error) {
      console.error('Error deleting sprint:', error);
      toast.error("Failed to delete sprint");
      throw error;
    }
  };

  const getSprintsByProject = (projectId: string) => 
    sprints.filter((s) => s.projectId === projectId);

  const addTask = async (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const isBacklogTask = task.status === "backlog";
      const projectId = task.projectId;

      if (!projectId) throw new Error('Project ID is required');

      console.log('Adding task with data:', task);

      const taskData = {
        title: task.title,
        description: task.description,
        status: task.status,
        assign_to: task.assignedTo,
        story_points: task.storyPoints,
        priority: task.priority,
        sprint_id: isBacklogTask ? null : task.sprintId,
        project_id: projectId,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      if (!data) throw new Error('Failed to create task');

      console.log('Task created in database:', data);

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        sprintId: data.sprint_id || '',
        status: data.status,
        assignedTo: data.assign_to,
        storyPoints: data.story_points,
        priority: data.priority as 'low' | 'medium' | 'high',
        createdAt: data.created_at,
        updatedAt: data.created_at,
        projectId: data.project_id,
        completionDate: data.completion_date
      };

      setTasks(prev => [...prev, newTask]);
      
      if (isBacklogTask) {
        await fetchBacklogTasks(projectId, true);
      } else if (task.sprintId) {
        await fetchTasksBySprint(task.sprintId, true);
      }
      
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const getTask = (id: string) => tasks.find((t) => t.id === id);

  const updateTask = async (id: string, task: Partial<Omit<Task, "id">>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const existingTask = tasks.find(t => t.id === id);
      if (!existingTask) throw new Error('Task not found');

      console.log('Updating task with data:', { id, ...task });

      const updateData: any = {
        title: task.title,
        description: task.description,
        status: task.status,
        assign_to: task.assignedTo,
        story_points: task.storyPoints,
        priority: task.priority
      };
      
      if ('completionDate' in task) {
        updateData.completion_date = task.completionDate;
        console.log('Setting completion_date to:', task.completionDate);
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      const updatedTask = {
        ...existingTask,
        ...task,
        updatedAt: new Date().toISOString(),
      };

      if (!('completionDate' in task) && existingTask.completionDate) {
        updatedTask.completionDate = existingTask.completionDate;
      }
      
      if (task.status === 'done' && existingTask.status !== 'done' && !updatedTask.completionDate) {
        const today = new Date().toISOString().split('T')[0];
        updatedTask.completionDate = today;
        
        await supabase
          .from('tasks')
          .update({ completion_date: today })
          .eq('id', id);
      }

      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
      const movedToBacklog = task.status === 'backlog' && existingTask.status !== 'backlog';
      const movedFromBacklog = task.status !== 'backlog' && existingTask.status === 'backlog';
      const sprintChanged = task.sprintId !== undefined && task.sprintId !== existingTask.sprintId;
      
      if (sprintChanged || movedToBacklog || movedFromBacklog) {
        console.log('Task moved between sprint/backlog, refreshing related data');
        
        if (existingTask.projectId) {
          if (existingTask.sprintId) {
            await fetchTasksBySprint(existingTask.sprintId, true);
          }
          
          if (task.sprintId) {
            await fetchTasksBySprint(task.sprintId, true);
          }
          
          await fetchBacklogTasks(existingTask.projectId, true);
        }
      }
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const taskToDelete = tasks.find(t => t.id === id);
      if (!taskToDelete) throw new Error('Task not found');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      
      if (taskToDelete.sprintId) {
        await fetchTasksBySprint(taskToDelete.sprintId, true);
      } else if (taskToDelete.projectId) {
        await fetchBacklogTasks(taskToDelete.projectId, true);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const getTasksBySprint = (sprintId: string) => 
    tasks.filter((t) => t.sprintId === sprintId);

  const getBacklogTasks = (projectId: string) =>
    tasks.filter((t) => t.status === "backlog" && t.projectId === projectId && !t.sprintId);

  const generateDefaultBurndownData = (): BurndownData[] => {
    const data: BurndownData[] = [];
    const today = new Date();
    
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: date.toISOString().split("T")[0],
        ideal: 0,
        actual: 0,
      });
    }
    
    return data;
  };

  const getBurndownData = (projectId: string) => 
    burndownData[projectId] || generateDefaultBurndownData();

  const fetchCollaborativeProjects = async () => {
    if (!user || isLoading) return;
    
    if (!shouldRefetch('collaborations') && projects.some(p => p.isCollaboration) && !fetchErrors['collaborations']) {
      console.log('Using cached collaborative projects data');
      return;
    }
    
    try {
      const { data, error } = await withRetry(async () => {
        return await supabase
          .from('collaborators')
          .select(`
            role,
            projects:project_id (
              id, 
              title, 
              description, 
              end_goal, 
              created_at, 
              updated_at,
              owner_id,
              owner:owner_id (username, email)
            )
          `)
          .eq('user_id', user.id);
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const collaborativeProjects = data
          .filter(item => item.projects)
          .map(item => {
            const project = item.projects as any;
            return {
              id: project.id,
              title: project.title,
              description: project.description || '',
              endGoal: project.end_goal,
              createdAt: project.created_at,
              updatedAt: project.updated_at,
              ownerId: project.owner_id,
              ownerName: project.owner?.username || '',
              ownerEmail: project.owner?.email || '',
              isCollaboration: true,
              role: item.role
            };
          });

        setProjects(prev => {
          const nonCollabProjects = prev.filter(p => !p.isCollaboration);
          return [...nonCollabProjects, ...collaborativeProjects];
        });

        updateFetchTime('collaborations');
        
        for (const project of collaborativeProjects) {
          await fetchSprints(project.id);
          await delay(500);
          await fetchBacklogTasks(project.id);
          await delay(500);
        }
      }
    } catch (error) {
      console.error('Error fetching collaborative projects:', error);
      markFetchError('collaborations');
      toast.error("Failed to load collaborative projects. Please try refreshing the page.");
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        sprints,
        tasks,
        burndownData,
        addProject,
        getProject,
        updateProject,
        deleteProject,
        addSprint,
        getSprint,
        updateSprint,
        deleteSprint,
        getSprintsByProject,
        addTask,
        getTask,
        updateTask,
        deleteTask,
        getTasksBySprint,
        getBacklogTasks,
        getBurndownData,
        fetchCollaborativeProjects,
        refreshProjectData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
