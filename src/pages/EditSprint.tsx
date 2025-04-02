
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, isBefore } from "date-fns";

const EditSprint: React.FC = () => {
  const { projectId, sprintId } = useParams<{ projectId: string, sprintId: string }>();
  const { getSprint, updateSprint } = useProjects();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [justification, setJustification] = useState("");
  const [originalEndDate, setOriginalEndDate] = useState("");
  const [requiresJustification, setRequiresJustification] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  
  const sprint = getSprint(sprintId || "");
  
  useEffect(() => {
    if (sprint) {
      setTitle(sprint.title);
      setDescription(sprint.description);
      setStartDate(sprint.startDate);
      setEndDate(sprint.endDate);
      setOriginalEndDate(sprint.endDate);
    }
  }, [sprint]);
  
  // Validate date changes for existing sprints
  const validateDates = (start: string, end: string) => {
    const errors: { startDate?: string; endDate?: string } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    // For an existing sprint, we only enforce the 4-week duration rule,
    // not the "start date must be today or future" rule
    
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
  
  useEffect(() => {
    // Check if end date has changed
    if (originalEndDate && endDate !== originalEndDate) {
      setRequiresJustification(true);
    } else {
      setRequiresJustification(false);
      setJustification("");
    }
    
    // Validate dates whenever they change
    if (startDate && endDate) {
      const errors = validateDates(startDate, endDate);
      setValidationErrors(errors);
    }
  }, [endDate, originalEndDate, startDate]);
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    if (newStartDate && endDate) {
      const errors = validateDates(newStartDate, endDate);
      setValidationErrors(errors);
    }
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    
    if (startDate && newEndDate) {
      const errors = validateDates(startDate, newEndDate);
      setValidationErrors(errors);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    if (requiresJustification && !justification.trim()) {
      toast.error("Justification is required when changing the sprint duration");
      return;
    }
    
    try {
      await updateSprint(sprintId || "", {
        title,
        description,
        startDate,
        endDate
      });
      
      toast.success("Sprint updated successfully");
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error("Error updating sprint:", error);
      toast.error("Failed to update sprint");
    }
  };
  
  if (!sprint) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Sprint not found</h2>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="scrum-button"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <button 
        onClick={() => navigate(`/projects/${projectId}`)}
        className="flex items-center gap-1 text-scrum-text-secondary hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Sprints</span>
      </button>
      
      <h2 className="text-xl font-bold mb-6">Edit Sprint</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
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
        
        <div>
          <label className="block mb-2 text-sm">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="scrum-input"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm">
              Start Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className={`scrum-input pl-10 ${validationErrors.startDate ? 'border-red-500' : ''}`}
                required
              />
              <Calendar className="absolute top-1/2 left-3 transform -translate-y-1/2 text-scrum-text-secondary h-4 w-4" />
              {validationErrors.startDate && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.startDate}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block mb-2 text-sm">
              End Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className={`scrum-input pl-10 ${validationErrors.endDate ? 'border-red-500' : ''}`}
                required
              />
              <Calendar className="absolute top-1/2 left-3 transform -translate-y-1/2 text-scrum-text-secondary h-4 w-4" />
              {validationErrors.endDate && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.endDate}</p>
              )}
            </div>
          </div>
        </div>
        
        {requiresJustification && (
          <div>
            <label className="block mb-2 text-sm">
              Justification for Changing Duration <span className="text-destructive">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="scrum-input"
              rows={3}
              placeholder="Please explain why you're changing the sprint duration"
              required
            />
          </div>
        )}
        
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="scrum-button flex items-center gap-2"
            disabled={Object.keys(validationErrors).length > 0}
          >
            <Save className="h-4 w-4" />
            Update Sprint
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSprint;
