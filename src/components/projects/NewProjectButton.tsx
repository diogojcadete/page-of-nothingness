
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

const NewProjectButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endGoal, setEndGoal] = useState("");
  const { addProject } = useProjects();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Project title is required");
      return;
    }
    
    try {
      const newProject = await addProject({
        title,
        description,
        endGoal,
      });
      
      toast.success("Project created successfully");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setEndGoal("");
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="scrum-button flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        <span>New Project</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-scrum-text-secondary hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 text-sm">
                  Project Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="scrum-input"
                  placeholder="e.g. Website Redesign"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="scrum-input min-h-[100px]"
                  placeholder="Brief description of the project"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm">
                  End Goal
                </label>
                <textarea
                  value={endGoal}
                  onChange={(e) => setEndGoal(e.target.value)}
                  className="scrum-input"
                  placeholder="What's the ultimate goal of this project?"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="scrum-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="scrum-button"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default NewProjectButton;
