import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function BudgetSummary({ stats }: { stats: any }) {
  const availableFunds = Math.max(0, stats.totalCollected - stats.spentAmount);
  const remainingToCollect = Math.max(0, stats.totalBudget - stats.totalCollected);
  
  const isZeroMoneyData = stats.totalBudget === 0 && stats.totalCollected === 0 && stats.spentAmount === 0;

  const moneyData = isZeroMoneyData ? [
    { name: "No Data", value: 1, color: "#1E293B" }
  ] : [
    { name: "Spent", value: stats.spentAmount, color: "#EF4444" },
    { name: "Available", value: availableFunds, color: "#22C55E" },
    { name: "To Collect", value: remainingToCollect, color: "#3B82F6" }
  ].filter((item) => item.value > 0);

  const moneyTotal = isZeroMoneyData ? 0 : Math.max(stats.totalBudget, stats.totalCollected);

  const isZeroMembersData = Number(stats.totalMembers) === 0;

  const membersData = isZeroMembersData ? [
    { name: "No Data", value: 1, color: "#1E293B" }
  ] : [
    { name: "Paid", value: stats.paidMembers, color: "#22C55E" },
    { name: "Unpaid / Pending", value: stats.unpaidMembers, color: "#F59E0B" },
    { name: "Not Interested", value: stats.notInterestedMembers, color: "#EF4444" }
  ].filter((item) => item.value > 0);

  const formatMoney = (val: number) => `₹ ${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
        <h2 className="text-lg font-semibold text-white mb-6">Budget Summary</h2>
        
        <div className="flex-1 flex flex-col xl:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <PieChart width={160} height={160}>
              <Pie
                data={moneyData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
              >
                {moneyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}50)` }} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-white tracking-tight">{formatMoney(moneyTotal)}</span>
              <span className="text-[10px] text-sv-text-secondary uppercase tracking-wider font-medium">Target</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            {!isZeroMoneyData ? moneyData.map((item) => {
              const totalMoneySum = moneyData.reduce((acc, curr) => acc + curr.value, 0);
              const percentage = totalMoneySum > 0 ? ((item.value / totalMoneySum) * 100).toFixed(1) : "0.0";
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 hover:bg-white/5 p-1 -ml-1 rounded premium-transition">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }} />
                     <div>
                       <p className="text-sm font-medium text-sv-text-primary leading-none mb-1">{item.name}</p>
                       <p className="text-xs text-white font-mono">{formatMoney(item.value)}</p>
                     </div>
                  </div>
                  <div className="text-sm font-medium text-sv-text-secondary">{percentage}%</div>
                </div>
              )
            }) : (
              <div className="text-center text-sv-text-secondary text-sm py-4">No budget data.</div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
        <h2 className="text-lg font-semibold text-white mb-6">Members Summary</h2>
        
        <div className="flex-1 flex flex-col xl:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <PieChart width={160} height={160}>
              <Pie
                data={membersData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
              >
                {membersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}50)` }} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white tracking-tight">{stats.totalMembers}</span>
              <span className="text-[10px] text-sv-text-secondary uppercase tracking-wider font-medium">Members</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
            {!isZeroMembersData ? membersData.map((item) => {
              const percentage = stats.totalMembers > 0 ? ((item.value / stats.totalMembers) * 100).toFixed(1) : "0.0";
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 hover:bg-white/5 p-1 -ml-1 rounded premium-transition">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }} />
                     <div>
                       <p className="text-sm font-medium text-sv-text-primary leading-none mb-1">{item.name}</p>
                       <p className="text-xs text-white font-mono">{item.value} people</p>
                     </div>
                  </div>
                  <div className="text-sm font-medium text-sv-text-secondary">{percentage}%</div>
                </div>
              )
            }) : (
              <div className="text-center text-sv-text-secondary text-sm py-4">No members yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
