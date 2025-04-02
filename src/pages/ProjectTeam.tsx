import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { fetchProjectCollaboratorsOptimized } from "@/lib/supabase";
import { Users, Mail, ChevronDown, CheckCircle, Clock, Star, Calendar, Shield, User } from "lucide-react";
import { Collaborator, Task } from "@/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

const ProjectTeam: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, sprints, tasks, getSprintsByProject } = useProjects();
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [owner, setOwner] = useState<{id: string, username: string, email: string} | null>(null);
  const [userTasks, setUserTasks] = useState<Record<string, Task[]>>({});
  const [userStats, setUserStats] = useState<Record<string, {
    assignedTasks: number,
    completedTasks: number,
    totalStoryPoints: number,
    completedStoryPoints: number
  }>>({});
  const [userSprintContributions, setUserSprintContributions] = useState<Record<string, string[]>>({});
  
  const project = getProject(projectId || "");
  
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        // Get collaborators and owner using the optimized function
        const { collaborators: collaboratorsData, owner: ownerData } = await fetchProjectCollaboratorsOptimized(projectId);
        setCollaborators(collaboratorsData);
        
        // Set owner data from the optimized fetch
        if (ownerData) {
          setOwner(ownerData);
        } else if (project?.ownerId && project?.ownerName) {
          // Fallback to project context data if available
          setOwner({
            id: project.ownerId,
            username: project.ownerName,
            email: project.ownerEmail || "No email available"
          });
        }
      } catch (error) {
        console.error("Error loading team data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCollaborators();
  }, [projectId, project]);
  
  useEffect(() => {
    if (!projectId) return;
    
    console.log("Processing task data for project:", projectId);
    console.log("Available tasks:", tasks.length);
    console.log("Available collaborators:", collaborators.length);
    console.log("Owner:", owner);
    console.log(`Owner Email: ${owner?.email}`);
    
    const projectSprints = getSprintsByProject(projectId);
    console.log("Project sprints:", projectSprints.length);
    
    const projectTasks = tasks.filter(task => {
      const isInSprint = projectSprints.some(sprint => sprint.id === task.sprintId);
      const isProjectBacklog = task.projectId === projectId && !task.sprintId;
      return isInSprint || isProjectBacklog;
    });
    
    console.log("Project tasks:", projectTasks.length);
    
    const tasksByUser: Record<string, Task[]> = {};
    const statsByUser: Record<string, {
      assignedTasks: number,
      completedTasks: number,
      totalStoryPoints: number,
      completedStoryPoints: number
    }> = {};
    const sprintsByUser: Record<string, string[]> = {};
    
    if (owner) {
      tasksByUser[owner.username] = [];
      statsByUser[owner.username] = {
        assignedTasks: 0,
        completedTasks: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0
      };
      sprintsByUser[owner.username] = [];
    }
    
    collaborators.forEach(collab => {
      tasksByUser[collab.username] = [];
      statsByUser[collab.username] = {
        assignedTasks: 0,
        completedTasks: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0
      };
      sprintsByUser[collab.username] = [];
    });
    
    projectTasks.forEach(task => {
      if (!task.assignedTo) return;
      
      console.log(`Processing task ${task.id} assigned to ${task.assignedTo}`);
      
      if (!tasksByUser[task.assignedTo]) {
        console.log(`Creating new entry for user ${task.assignedTo}`);
        tasksByUser[task.assignedTo] = [];
        statsByUser[task.assignedTo] = {
          assignedTasks: 0,
          completedTasks: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0
        };
        sprintsByUser[task.assignedTo] = [];
      }
      
      tasksByUser[task.assignedTo].push(task);
      
      const storyPoints = task.storyPoints || 0;
      statsByUser[task.assignedTo].totalStoryPoints += storyPoints;
      
      if (task.sprintId) {
        const sprint = projectSprints.find(s => s.id === task.sprintId);
        if (sprint && !sprintsByUser[task.assignedTo].includes(sprint.title)) {
          sprintsByUser[task.assignedTo].push(sprint.title);
        }
      }
      
      if (task.status === 'done') {
        statsByUser[task.assignedTo].completedTasks++;
        statsByUser[task.assignedTo].completedStoryPoints += storyPoints;
      } else {
        statsByUser[task.assignedTo].assignedTasks++;
      }
    });
    
    console.log("Task mapping by user:", Object.keys(tasksByUser).map(id => `${id}: ${tasksByUser[id].length} tasks`));
    console.log("Stats by user:", statsByUser);
    console.log("Sprint contributions by user:", sprintsByUser);
    
    setUserTasks(tasksByUser);
    setUserStats(statsByUser);
    setUserSprintContributions(sprintsByUser);
  }, [projectId, tasks, collaborators, owner, getSprintsByProject]);
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">Loading team information...</div>
      </div>
    );
  }
  
  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case 'scrum_master':
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case 'product_owner':
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case 'team_member':
        return "bg-violet-100 text-violet-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400";
    }
  };
  
  const renderTaskDropdown = (userId: string) => {
    const userTaskList = userTasks[userId] || [];
    
    if (userTaskList.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No tasks assigned
        </div>
      );
    }
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="text-sm flex items-center gap-1 hover:text-primary transition-colors">
          <span>View {userTaskList.length} task{userTaskList.length !== 1 ? 's' : ''}</span>
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-auto">
          {userTaskList.map(task => (
            <DropdownMenuItem key={task.id} className="flex flex-col items-start">
              <div className="font-medium truncate w-full">{task.title}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`px-1.5 py-0.5 rounded-full ${task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                  {task.status === 'done' ? 'Complete' : 'In Progress'}
                </span>
                {task.storyPoints && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3" />
                    {task.storyPoints}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderSprintContributions = (username: string) => {
    const contributions = userSprintContributions[username] || [];
    
    if (contributions.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No sprint contributions yet
        </div>
      );
    }
    
    return (
      <div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Sprint Contributions:</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {contributions.map((sprint, index) => (
            <Badge key={index} variant="outline" className="text-xs bg-accent/50">
              {sprint}
            </Badge>
          ))}
        </div>
      </div>
    );
  };
  
  const renderUserStats = (username: string) => {
    const stats = userStats[username];
    
    if (!stats) {
      return null;
    }
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Active: {stats.assignedTasks}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span>Completed: {stats.completedTasks}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="h-4 w-4" />
          <span>Points: {stats.completedStoryPoints} / {stats.totalStoryPoints}</span>
        </div>
        {renderTaskDropdown(username)}
      </div>
    );
  };

  const formatJoinDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Team</h2>
      
      <div className="space-y-6">
        <div className="scrum-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Project Owner
          </h3>
          
          {owner ? (
            <Card className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30 overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex flex-col items-center justify-center bg-amber-50/80 dark:bg-amber-900/10 min-w-[150px]">
                    <Avatar className="h-16 w-16 bg-amber-100 dark:bg-amber-700 text-amber-700 dark:text-amber-200 mb-2">
                      <AvatarFallback className="text-xl">
                        {owner.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="font-semibold text-center">{owner.username}</h4>
                    <Badge className="mt-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-200 dark:hover:bg-amber-700">
                      Owner
                    </Badge>
                  </div>
                  
                  <div className="flex-1 p-6">
                    <div className="text-sm flex items-center gap-1 mb-3">
                      <Mail className="h-4 w-4" />
                      <span>{owner.email}</span>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="space-y-4">
                      {renderUserStats(owner.username)}
                      {renderSprintContributions(owner.username)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-muted-foreground">Owner information not available</div>
          )}
        </div>
        
        <div className="scrum-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Team Members
          </h3>
          
          {collaborators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collaborators.map(collab => {
                let cardStyle = "";
                let sidebarStyle = "";
                
                if (collab.role === 'scrum_master') {
                  cardStyle = "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30";
                  sidebarStyle = "bg-blue-50/80 dark:bg-blue-900/10";
                } else if (collab.role === 'product_owner') {
                  cardStyle = "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30";
                  sidebarStyle = "bg-green-50/80 dark:bg-green-900/10";
                } else {
                  cardStyle = "bg-gradient-to-r from-violet-50 to-violet-100 dark:from-purple-900/20 dark:to-purple-800/20 border-violet-200 dark:border-purple-800/30";
                  sidebarStyle = "bg-violet-50/80 dark:bg-purple-900/10";
                }
                
                let avatarStyle = "";
                if (collab.role === 'scrum_master') {
                  avatarStyle = "bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200";
                } else if (collab.role === 'product_owner') {
                  avatarStyle = "bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-200";
                } else {
                  avatarStyle = "bg-violet-100 dark:bg-purple-700 text-violet-700 dark:text-purple-200";
                }
                
                return (
                  <Card key={collab.id} className={`${cardStyle} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                    <CardContent className="p-0">
                      <div className="flex flex-col">
                        <div className={`p-4 flex items-center gap-3 border-b border-border/50 ${sidebarStyle}`}>
                          <Avatar className={`h-12 w-12 ${avatarStyle}`}>
                            <AvatarFallback className="text-lg">
                              {collab.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-semibold truncate">{collab.username}</h4>
                            <div className="flex items-center flex-wrap gap-2">
                              <Badge className={`text-xs ${getRoleBadgeClass(collab.role)}`}>
                                {collab.role === 'scrum_master' ? 'Scrum Master' : 
                                 collab.role === 'product_owner' ? 'Product Owner' : 
                                 'Team Member'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          {collab.email && (
                            <div className="text-sm flex items-center gap-1 mb-3">
                              <Mail className="h-4 w-4" />
                              <span>{collab.email}</span>
                            </div>
                          )}
                          
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Joined: {formatJoinDate(collab.createdAt)}</span>
                          </div>
                          
                          <Separator className="my-2" />
                          
                          {renderUserStats(collab.username)}
                          {renderSprintContributions(collab.username)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground">No team members yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTeam;
