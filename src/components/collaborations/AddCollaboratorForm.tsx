
import React, { useState } from "react";
import { findUserByEmailOrUsername, addCollaborator } from "@/lib/supabase";
import { ProjectRole } from "@/types";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface AddCollaboratorFormProps {
  projectId: string;
  onCollaboratorAdded: () => void;
}

const AddCollaboratorForm: React.FC<AddCollaboratorFormProps> = ({ 
  projectId,
  onCollaboratorAdded 
}) => {
  const { user } = useAuth();
  const [userIdentifier, setUserIdentifier] = useState("");
  const [role, setRole] = useState<ProjectRole>("team_member");
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userIdentifier.trim()) {
      toast.error("Please enter a username or email");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to add collaborators");
      return;
    }
    
    setLoading(true);
    
    try {
      // First find the user
      const foundUser = await findUserByEmailOrUsername(userIdentifier);
      
      if (!foundUser) {
        toast.error("User not found");
        setLoading(false);
        return;
      }

      // Don't allow adding yourself as a collaborator
      if (foundUser.id === user.id) {
        toast.error("You can't add yourself as a collaborator");
        setLoading(false);
        return;
      }
      
      // Then add them as a collaborator
      await addCollaborator(projectId, foundUser.id, role);
      
      toast.success(`${foundUser.username} added as a collaborator`);
      setUserIdentifier("");
      onCollaboratorAdded();
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast.error("Failed to add collaborator");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-scrum-text-secondary" />
        <h3 className="text-lg font-semibold">Add Collaborator</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-scrum-card border border-scrum-border rounded-md p-4">
        <div className="mb-4">
          <label className="block mb-2 text-sm">
            Username or Email
          </label>
          <input
            type="text"
            value={userIdentifier}
            onChange={(e) => setUserIdentifier(e.target.value)}
            className="scrum-input"
            placeholder="Enter username or email"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 text-sm">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ProjectRole)}
            className="scrum-input"
          >
            <option value="product_owner">Product Owner - Can view projects and manage product backlog</option>
            <option value="team_member">Team Member - Can manage tasks in sprints</option>
            <option value="scrum_master">Scrum Master - Can manage sprints and move items from backlog</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading || !userIdentifier.trim()}
          className="scrum-button flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span>Add Collaborator</span>
        </button>
      </form>
    </div>
  );
};

export default AddCollaboratorForm;
