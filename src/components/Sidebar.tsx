import React, { useState } from "react";
import { cn } from "../lib/utils";
import { 
  Shield, 
  LayoutDashboard, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  PieChart, 
  Image as ImageIcon, 
  Download, 
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useSettings } from "../hooks/useData";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full gap-3 px-4 py-3 rounded-xl premium-transition group relative",
        active 
          ? "bg-sv-primary/10 text-sv-accent glow-blue" 
          : "text-sv-text-secondary hover:text-white hover:bg-white/5"
      )}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sv-accent rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      )}
      <Icon className={cn("w-5 h-5", active ? "text-sv-accent" : "text-sv-text-secondary group-hover:text-sv-text-primary")} strokeWidth={active ? 2.5 : 2} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

export function Sidebar({ currentView, onViewChange, isOpen, onClose }: any) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [showQR, setShowQR] = useState(false);
  const [showQROptions, setShowQROptions] = useState(false);

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      signOut(auth);
    }
  };

  const handleNavClick = (view: string) => {
    onViewChange(view);
    if (onClose) onClose();
  };

  const initial = user?.displayName ? user.displayName[0].toUpperCase() : "AD";
  const name = user?.displayName || "Admin";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={cn(
        "w-64 h-screen fixed left-0 top-0 bg-[#060B16] border-r border-sv-border/30 flex flex-col z-50 premium-transition lg:translate-x-0 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-sv-border/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sv-primary to-blue-800 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Shield className="w-6 h-6 text-white" fill="currentColor" strokeWidth={1} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white leading-tight">Sword Payment</span>
            <span className="text-xs text-sv-text-secondary leading-tight">Tracker</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentView === "dashboard"} onClick={() => handleNavClick("dashboard")} />
          <NavItem icon={UserPlus} label="Add New Person" active={currentView === "add"} onClick={() => handleNavClick("add")} />
          <div className="h-4" /> {/* Spacer */}
          <NavItem icon={CheckCircle2} label="Paid Members" active={currentView === "paid"} onClick={() => handleNavClick("paid")} />
          <NavItem icon={XCircle} label="Unpaid Members" active={currentView === "unpaid"} onClick={() => handleNavClick("unpaid")} />
          <div className="h-4" /> {/* Spacer */}
          <NavItem icon={PieChart} label="Budget Tracker" active={currentView === "budget"} onClick={() => handleNavClick("budget")} />
          <NavItem icon={ImageIcon} label="Payment Proofs" active={currentView === "proofs"} onClick={() => handleNavClick("proofs")} />
          <NavItem icon={Download} label="Export Data" active={currentView === "export"} onClick={() => handleNavClick("export")} />
          <NavItem icon={Settings} label="Settings" active={currentView === "settings"} onClick={() => handleNavClick("settings")} />
        </div>

        {/* QR Widget */}
        <div className="px-4 mb-4 mt-auto pt-6">
          <div className="glass-panel rounded-2xl p-4 w-[160px] mx-auto flex flex-col items-center border-sv-border/80 text-center relative group">
            <p className="text-xs font-bold text-white mb-0.5">UPI Payment</p>
            <p className="text-[10px] text-sv-text-secondary mb-3">Scan to Pay</p>
            <button 
              onClick={() => setShowQR(true)}
              className="w-24 h-24 bg-white rounded-lg p-1.5 mb-2 flex items-center justify-center shadow-inner overflow-hidden hover:scale-105 premium-transition relative"
            >
              {settings?.qrImageUrl ? (
                 <img src={settings?.qrImageUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                 <div className="w-full h-full bg-contain bg-no-repeat bg-center opacity-90 mix-blend-multiply" style={{ backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${settings?.qrUpiId || 'swords@sbi'}&pn=Sword%20Payment')` }} />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold">Zoom</span>
              </div>
            </button>
            <button onClick={() => setShowQROptions(!showQROptions)} className="text-[10px] text-sv-text-secondary hover:text-white font-mono w-full truncate border-t border-sv-border/50 pt-2 mt-1 premium-transition relative">
              ID: {settings?.qrUpiId || 'swords@sbi'}
            </button>
            {showQROptions && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-[#0B1220] border border-sv-border rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                <button 
                  onClick={() => { setShowQROptions(false); handleNavClick("settings"); }}
                  className="w-full px-4 py-2.5 text-xs text-left text-white hover:bg-sv-primary/20 hover:text-sv-primary premium-transition border-b border-sv-border"
                >
                  Update ID
                </button>
                <button 
                  onClick={() => { setShowQROptions(false); handleNavClick("settings"); }}
                  className="w-full px-4 py-2.5 text-xs text-left text-white hover:bg-sv-primary/20 hover:text-sv-primary premium-transition"
                >
                  Change QR
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-sv-border/50">
          <button onClick={handleLogout} className="flex items-center w-full gap-3 px-2 py-2 rounded-xl hover:bg-sv-danger/10 text-sv-text-primary hover:text-sv-danger premium-transition group">
            <div className="w-9 h-9 rounded-full bg-sv-border flex items-center justify-center text-sm font-medium group-hover:bg-sv-danger/20">
              {initial}
            </div>
            <div className="flex flex-col items-start flex-1 overflow-hidden">
              <span className="text-sm font-medium truncate w-full">{name}</span>
              <span className="text-[10px] text-sv-text-secondary">Administrator</span>
            </div>
            <LogOut className="w-4 h-4 text-sv-text-secondary group-hover:text-sv-danger" />
          </button>
        </div>
      </aside>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowQR(false)} />
          <div className="bg-[#0B1220] border border-sv-border p-6 rounded-3xl relative z-10 w-full max-w-sm flex flex-col items-center shadow-2xl">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-sv-text-secondary hover:text-white premium-transition">
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">Scan to Pay</h3>
            <p className="text-sm text-sv-text-secondary mb-6">Use any UPI app to pay</p>
            <div className="w-full aspect-square bg-white rounded-2xl p-4 flex items-center justify-center mb-6 shadow-inner">
              {settings?.qrImageUrl ? (
                 <img src={settings?.qrImageUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
              ) : (
                 <div className="w-full h-full bg-contain bg-no-repeat bg-center mix-blend-multiply" style={{ backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=upi://pay?pa=${settings?.qrUpiId || 'swords@sbi'}&pn=Sword%20Payment')` }} />
              )}
            </div>
            <div className="w-full bg-[#1A2234] rounded-xl p-4 flex flex-col items-center border border-white/5">
               <p className="text-xs text-sv-text-secondary mb-1">UPI ID</p>
               <p className="font-mono text-sm font-semibold text-white break-all">{settings?.qrUpiId || 'swords@sbi'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
