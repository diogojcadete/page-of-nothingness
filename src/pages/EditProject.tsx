import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Save, FileEdit } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  title: z.string().min(1, "Project title is required").max(100),
  description: z.string().optional(),
  endGoal: z.string().optional(),
});

const EditProject: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, updateProject } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const project = getProject(projectId || "");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      endGoal: project?.endGoal || "",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title,
        description: project.description || "",
        endGoal: project.endGoal || "",
      });
    }
  }, [project, form]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Button 
            onClick={() => navigate("/")}
            variant="default"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !project) return;
    
    setIsLoading(true);
    try {
      await updateProject(project.id, {
        title: values.title,
        description: values.description || "",
        endGoal: values.endGoal || "",
      });
      
      toast.success("Project updated successfully");
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen animate-fade-in bg-gradient-to-b from-background to-background/80">
      <div className="container px-4 py-8 max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(`/projects/${project.id}`)}
          className="flex items-center gap-1 text-scrum-text-secondary hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Project</span>
        </button>
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-md mb-8">
          <div className="flex items-center gap-3 mb-6">
            <FileEdit className="h-6 w-6 text-primary/80" />
            <h1 className="text-2xl font-bold">Edit Project</h1>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Project Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter project title" 
                        {...field} 
                        className="transition-all focus:ring-2 focus:ring-primary/30"
                      />
                    </FormControl>
                    <FormDescription>
                      Give your project a clear, descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter project description" 
                        {...field} 
                        className="min-h-[120px] transition-all focus:ring-2 focus:ring-primary/30 resize-y"
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what this project is about and its main objectives
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">End Goal</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What's the final goal of this project?" 
                        {...field}
                        className="min-h-[120px] transition-all focus:ring-2 focus:ring-primary/30 resize-y"
                      />
                    </FormControl>
                    <FormDescription>
                      Define the successful outcome for this project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-4 pt-2">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="transition-all hover:scale-105"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="transition-colors hover:bg-destructive/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditProject;
