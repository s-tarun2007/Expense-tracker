import React, { useMemo, useState } from "react";
import { Member } from "../data";
import { CheckCircle2, ArrowRight, Bell, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils";

export function RecentActivity({ members }: { members: Member[] }) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  const selectedPayments = useMemo(() => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    return members
      .filter(m => {
        if (m.status !== "Paid") return false;
        
        let mDate = new Date();
        if (m.date) {
            mDate = new Date(m.date);
        } else if (m.updatedAt) {
            mDate = m.updatedAt.toDate ? m.updatedAt.toDate() : new Date(m.updatedAt);
        } else if (m.createdAt) {
            mDate = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
        } else {
            return false;
        }
        
        mDate.setHours(0, 0, 0, 0);
        return mDate.getTime() === targetDate.getTime();
      })
      .sort((a, b) => {
          let tA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.date || 0).getTime());
          let tB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.date || 0).getTime());
          return tB - tA;
      });
  }, [members, selectedDate]);

  const formatTime = (member: Member) => {
    const ts = member.updatedAt || member.createdAt || member.date;
    if (!ts) return "";
    let d = new Date();
    if (ts.toDate) d = ts.toDate();
    else if (typeof ts === "number") d = new Date(ts);
    else if (typeof ts === "string") d = new Date(ts);
    return d.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div id="notifications-section" className="glass-panel p-6 rounded-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-sv-primary" />
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-sv-bg border border-sv-border rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-sv-primary premium-transition"
            title="Select Date"
          />
        </div>
      </div>
      
      <div className="flex-1 space-y-6 overflow-y-auto max-h-[360px] pr-2 custom-scrollbar">
        {selectedPayments.map((member, index) => {
          return (
            <div key={member.id} className="flex gap-4 relative">
              {/* Connector line */}
              {index !== selectedPayments.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-sv-border" />
              )}
              
              {/* Icon */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border z-10 bg-sv-success/10 border-sv-success/20">
                <CheckCircle2 className="w-4 h-4 text-sv-success" />
              </div>
              
              {/* Content */}
              <div className="pt-1.5 flex-1">
                <p className="text-sm text-sv-text-primary leading-tight mb-1">
                  <span className="font-medium text-white">{member.name}</span> paid <span className="text-sv-success font-medium">₹{member.amount}</span>
                </p>
                <p className="text-xs text-sv-text-secondary font-mono">{formatTime(member)}</p>
              </div>
            </div>
          );
        })}
        {selectedPayments.length === 0 && (
          <div className="text-center text-sv-text-secondary text-sm py-8 flex flex-col items-center">
            <CalendarIcon className="w-8 h-8 mb-3 opacity-20" />
            <p>No payments recorded for {selectedDate}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
