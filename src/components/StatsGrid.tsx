import React from "react";
import { Users, CheckCircle2, XCircle, IndianRupee, Wallet, UserMinus } from "lucide-react";
import { cn } from "../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendLabel?: string;
  colorClass: string;
  iconBgClass: string;
}

function StatCard({ title, value, icon: Icon, trend, trendLabel, colorClass, iconBgClass }: StatCardProps) {
  return (
    <div className="glass-panel p-4 rounded-xl group hover:-translate-y-1 premium-transition relative overflow-hidden flex flex-col justify-between border-sv-border/80">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-full flex shrink-0 items-center justify-center border border-sv-border/50", iconBgClass)}>
          <Icon className={cn("w-5 h-5", colorClass)} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-none mb-1">{value}</h3>
          <p className="text-[10px] sm:text-xs text-sv-text-secondary font-medium leading-none truncate">{title}</p>
        </div>
      </div>
      
      {(trend || trendLabel) && (
        <div className="pt-3 border-t border-sv-border/60 flex items-center gap-1 text-[10px] w-full mt-auto">
          {trend && trend.trim() !== "" && <span className={cn("font-medium shrink-0", colorClass)}>{trend}</span>}
          {trendLabel && <span className="text-sv-text-secondary truncate">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function StatsGrid({ stats }: { stats: any }) {
  const formatSec = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);

  const paidPercent = stats.totalMembers > 0 ? ((stats.paidMembers / stats.totalMembers) * 100).toFixed(1) + "%" : "0%";
  const unpaidPercent = stats.totalMembers > 0 ? ((stats.unpaidMembers / stats.totalMembers) * 100).toFixed(1) + "%" : "0%";
  const notInterestedPercent = stats.totalMembers > 0 ? ((stats.notInterestedMembers / stats.totalMembers) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
      <StatCard 
        title="Total Members" 
        value={stats.totalMembers} 
        icon={Users} 
        colorClass="text-purple-400" 
        iconBgClass="bg-purple-500/10"
        trendLabel="All registered members"
      />
      <StatCard 
        title="Paid Members" 
        value={stats.paidMembers} 
        icon={CheckCircle2} 
        colorClass="text-sv-success" 
        iconBgClass="bg-sv-success/10"
        trend={paidPercent}
        trendLabel="of total members"
      />
      <StatCard 
        title="Unpaid Members" 
        value={stats.unpaidMembers} 
        icon={XCircle} 
        colorClass="text-sv-danger" 
        iconBgClass="bg-sv-danger/10"
        trend={unpaidPercent}
        trendLabel="of total members"
      />
      <StatCard 
        title="Not Interested" 
        value={stats.notInterestedMembers || 0} 
        icon={UserMinus} 
        colorClass="text-red-400" 
        iconBgClass="bg-red-400/10"
        trend={notInterestedPercent}
        trendLabel="of total members"
      />
      <StatCard 
        title="Total Collected" 
        value={formatSec(stats.totalCollected)} 
        icon={IndianRupee} 
        colorClass="text-sv-primary" 
        iconBgClass="bg-sv-primary/10"
        trendLabel="Total amount received"
      />
      <StatCard 
        title="Pending Amount" 
        value={formatSec(stats.pendingAmount)} 
        icon={Wallet} 
        colorClass="text-sv-pending" 
        iconBgClass="bg-sv-pending/10"
        trendLabel="Total amount pending"
      />
    </div>
  );
}

