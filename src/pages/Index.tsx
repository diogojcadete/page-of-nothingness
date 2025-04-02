
// Update this page with a home page for our scrum management app

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-accent/10 p-6">
      <div className="w-full max-w-3xl text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Agile Scrum Management</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Streamline your agile workflow with our comprehensive scrum management tool.
          Track sprints, manage backlogs, and collaborate with your team seamlessly.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="scrum-card p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Create Projects</h3>
            <p className="text-muted-foreground">Set up projects, define end goals, and organize your work effectively.</p>
          </div>
          
          <div className="scrum-card p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M8 6h10"></path>
                <path d="M8 12h9"></path>
                <path d="M8 18h8"></path>
                <path d="M3 6h2"></path>
                <path d="M3 12h2"></path>
                <path d="M3 18h2"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Manage Backlogs</h3>
            <p className="text-muted-foreground">Organize and prioritize your product backlog with our intuitive interface.</p>
          </div>
          
          <div className="scrum-card p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Track Progress</h3>
            <p className="text-muted-foreground">Monitor sprint progress with burndown charts and visual task boards.</p>
          </div>
          
          <div className="scrum-card p-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Collaborate</h3>
            <p className="text-muted-foreground">Work together with your team, assign tasks, and track contributions.</p>
          </div>
        </div>
        
        <div className="mt-12">
          <a href="/login" className="scrum-button">
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
