import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function DashboardLayout({ children, currentView, onViewChange }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sv-bg text-sv-text-primary selection:bg-sv-primary/30 selection:text-white flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={onViewChange} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen z-10 relative pb-16 lg:pb-0">
        {/* Background ambient glow */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
      
      <BottomNav 
        currentView={currentView} 
        onViewChange={onViewChange} 
        onMoreClick={() => setSidebarOpen(true)} 
      />
    </div>
  );
}
