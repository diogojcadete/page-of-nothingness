
import React from "react";
import { useProjects } from "@/context/ProjectContext";
import Navbar from "@/components/layout/Navbar";
import ProjectCard from "@/components/projects/ProjectCard";
import NewProjectButton from "@/components/projects/NewProjectButton";
import NavLink from "@/components/ui/NavLink";
import { Folder, Users, LayoutDashboard } from "lucide-react";

const Projects: React.FC = () => {
  const { projects } = useProjects();

  return (
    <div className="min-h-screen pt-16 animate-fade-in">
      <Navbar />
      
      <div className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <NewProjectButton />
        </div>

        <div className="flex items-center gap-2 bg-scrum-card rounded-md border border-scrum-border p-1 w-fit mb-6">
          <NavLink to="/" end={true}>
            <LayoutDashboard className="h-4 w-4 mr-1" />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/projects">
            <Folder className="h-4 w-4 mr-1" />
            <span>My Projects</span>
          </NavLink>
          <NavLink to="/collaborations">
            <Users className="h-4 w-4 mr-1" />
            <span>My Collaborations</span>
          </NavLink>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 bg-scrum-card border border-scrum-border rounded-lg">
            <p className="text-scrum-text-secondary mb-4">You don't have any projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
