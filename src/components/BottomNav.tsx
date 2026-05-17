import React from "react";
import { cn } from "../lib/utils";
import { 
  LayoutDashboard, 
  UserPlus, 
  CheckCircle2, 
  XCircle,
  MoreVertical
} from "lucide-react";

interface BottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onMoreClick: () => void;
}

export function BottomNav({ currentView, onViewChange, onMoreClick }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#060B16]/95 backdrop-blur-3xl border-t border-sv-border flex items-center justify-around z-50 lg:hidden px-2 pb-safe">
      <button 
        onClick={() => onViewChange("dashboard")}
        className={cn("flex flex-col items-center gap-1 min-w-[64px] py-2", currentView === "dashboard" ? "text-sv-primary" : "text-sv-text-secondary")}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-medium">Dashboard</span>
      </button>

      <button 
        onClick={() => onViewChange("add")}
        className={cn("flex flex-col items-center gap-1 min-w-[64px] py-2", currentView === "add" ? "text-sv-primary" : "text-sv-text-secondary")}
      >
        <UserPlus className="w-5 h-5" />
        <span className="text-[10px] font-medium">Add Person</span>
      </button>

      <button 
        onClick={() => onViewChange("paid")}
        className={cn("flex flex-col items-center gap-1 min-w-[64px] py-2", currentView === "paid" ? "text-sv-primary" : "text-sv-text-secondary")}
      >
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-[10px] font-medium">Paid</span>
      </button>

      <button 
        onClick={() => onViewChange("unpaid")}
        className={cn("flex flex-col items-center gap-1 min-w-[64px] py-2", currentView === "unpaid" ? "text-sv-primary" : "text-sv-text-secondary")}
      >
        <XCircle className="w-5 h-5" />
        <span className="text-[10px] font-medium">Unpaid</span>
      </button>

      <button 
        onClick={onMoreClick}
        className="flex flex-col items-center gap-1 min-w-[64px] py-2 text-sv-text-secondary"
      >
        <MoreVertical className="w-5 h-5" />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </div>
  );
}
