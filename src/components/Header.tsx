import React from "react";
import { Search, Bell, CalendarDays, Menu, Shield } from "lucide-react";
import { format } from "date-fns";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const today = format(new Date(), "MMM dd, yyyy");

  return (
    <header className="h-20 flex items-center justify-between px-4 lg:px-8 border-b border-sv-border/50 sticky top-0 z-30 bg-[#060B16]/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-sv-text-secondary hover:text-white rounded-lg hover:bg-sv-border">
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Mobile Logo View */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sv-primary to-blue-800 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Shield className="w-4 h-4 text-white" fill="currentColor" strokeWidth={1} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white leading-tight text-sm">Sword</span>
            <span className="text-[10px] text-sv-text-secondary leading-tight">Payment Tracker</span>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-sv-text-secondary">Track payments and manage your budget</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Date Selector mock */}
        <div 
          onClick={() => {
            const el = document.getElementById("notifications-section");
            if(el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg bg-sv-card border border-sv-border text-xs sm:text-sm text-sv-text-secondary cursor-pointer hover:border-sv-primary hover:text-white premium-transition"
        >
          <CalendarDays className="w-4 h-4" />
          <span>{today}</span>
        </div>
      </div>
    </header>
  );
}
