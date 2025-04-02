
import React, { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { format, addWeeks, isBefore, differenceInDays } from "date-fns";

interface NewSprintButtonProps {
  projectId: string;
}

const NewSprintButton: React.FC<NewSprintButtonProps> = ({ projectId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { addSprint } = useProjects();
  const { user, isOwner, userRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  
  // Only owners and scrum masters can create sprints
  const canCreateSprint = isOwner || userRole === 'scrum_master';
  
  // If user can't create sprints, don't render the button
  if (!canCreateSprint) {
    return null;
  }
  
  // Set default start date to today and end date to 2 weeks from today
  useEffect(() => {
    const today = new Date();
    const twoWeeksLater = addWeeks(today, 2);
    
    setStartDate(format(today, 'yyyy-MM-dd'));
    setEndDate(format(twoWeeksLater, 'yyyy-MM-dd'));
  }, [isModalOpen]);
  
  // Validate date changes
  const validateDates = (start: string, end: string) => {
    const errors: { startDate?: string; endDate?: string } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    // Start date validation - must be today or future
    if (isBefore(startDateObj, today)) {
      errors.startDate = "Start date must be today or a future date";
    }
    
    // Duration validation - max 4 weeks (28 days)
    if (start && end) {
      const daysDifference = differenceInDays(endDateObj, startDateObj);
      if (daysDifference > 28) {
        errors.endDate = "Sprint duration cannot exceed 4 weeks (28 days)";
      } else if (daysDifference < 1) {
        errors.endDate = "End date must be after start date";
      }
    }
    
    return errors;
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    // Validate dates whenever start date changes
    const errors = validateDates(newStartDate, endDate);
    setValidationErrors(errors);
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    
    // Validate dates whenever end date changes
    const errors = validateDates(startDate, newEndDate);
    setValidationErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a sprint");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Sprint title is required");
      return;
    }
    
    if (!startDate) {
      toast.error("Start date is required");
      return;
    }
    
    if (!endDate) {
      toast.error("End date is required");
      return;
    }
    
    // Final validation before submission
    const errors = validateDates(startDate, endDate);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMessages = Object.values(errors).join(", ");
      toast.error(errorMessages);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log("Creating sprint with data:", {
        title,
        description,
        project_id: projectId,
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        status: "in-progress"
      });
      
      // Direct Supabase insert with clearer error handling
      const { data, error } = await supabase
        .from('sprints')
        .insert({
          title,
          description,
          project_id: projectId,
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
          status: "in-progress" // Always set to in-progress
        })
        .select();
      
      if (error) {
        console.error("Sprint creation error:", error);
        toast.error(`Failed to create sprint: ${error.message}`);
        return;
      }
      
      toast.success("Sprint created successfully");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      
      // Refresh the UI
      window.location.reload();
    } catch (error: any) {
      console.error("Sprint creation error:", error);
      toast.error(`Failed to create sprint: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="scrum-button flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        <span>New Sprint</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-scrum-card border border-scrum-border rounded-lg p-6 w-full max-w-lg animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New Sprint</h2>
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
                  Sprint Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="scrum-input"
                  placeholder="e.g. Sprint 1"
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
                  className="scrum-input"
                  placeholder="Sprint goals and objectives"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-2 text-sm">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className={`scrum-input ${validationErrors.startDate ? 'border-red-500' : ''}`}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                  {validationErrors.startDate && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.startDate}</p>
                  )}
                </div>
                
                <div>
                  <label className="block mb-2 text-sm">
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className={`scrum-input ${validationErrors.endDate ? 'border-red-500' : ''}`}
                    required
                  />
                  {validationErrors.endDate && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.endDate}</p>
                  )}
                </div>
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
                  disabled={isSubmitting || Object.keys(validationErrors).length > 0}
                >
                  {isSubmitting ? "Creating..." : "Create Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default NewSprintButton;
