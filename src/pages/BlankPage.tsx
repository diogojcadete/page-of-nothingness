
import React from "react";

const BlankPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Blank Page</h1>
        </header>
        <main>
          <div className="bg-card rounded-lg shadow p-6">
            <p className="text-muted-foreground">This is a blank page ready for your content.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BlankPage;
