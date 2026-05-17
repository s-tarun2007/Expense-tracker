/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DashboardLayout } from "./components/DashboardLayout";
import { StatsGrid } from "./components/StatsGrid";
import { MembersTable } from "./components/MembersTable";
import { BudgetSummary } from "./components/BudgetSummary";
import { RecentActivity } from "./components/RecentActivity";
import { AddPersonForm } from "./components/AddPersonForm";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginScreen } from "./components/LoginScreen";
import { useMembers, useActivities, useSettings, useStats } from "./hooks/useData";
import { SettingsView } from "./components/SettingsView";
import { AIChatBot } from "./components/AIChatBot";
import { useState } from "react";

import { ExportView } from "./components/ExportView";

function AuthenticatedDashboard({ user }: { user: any }) {
  const [currentView, setCurrentView] = useState("dashboard");
  const { members } = useMembers();
  const { activities } = useActivities();
  const { settings } = useSettings();
  
  const stats = useStats(members, settings);

  let content = null;
  switch (currentView) {
    case "dashboard":
      content = (
        <div className="max-w-7xl mx-auto space-y-6">
          <section><StatsGrid stats={stats} /></section>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6"><MembersTable members={members} /></div>
            <div className="flex flex-col gap-6"><BudgetSummary stats={stats} /><RecentActivity members={members} /></div>
          </section>
        </div>
      );
      break;
    case "add": content = <AddPersonForm />; break;
    case "paid": content = <MembersTable members={members} initialFilter="Paid" />; break;
    case "unpaid": content = <MembersTable members={members} initialFilter="Unpaid" />; break;
    case "budget": content = <div className="max-w-4xl mx-auto space-y-6"><StatsGrid stats={stats} /><BudgetSummary stats={stats} /></div>; break;
    case "proofs": content = <MembersTable members={members} initialFilter="Proofs" />; break;
    case "settings": content = <SettingsView settings={settings} />; break;
    case "export": content = <ExportView members={members} />; break;
    default: content = <div>View not found</div>;
  }

  return (
    <DashboardLayout currentView={currentView} onViewChange={setCurrentView}>
      <div className="pb-20 max-w-7xl mx-auto">
        {content}
      </div>
      <AIChatBot />
    </DashboardLayout>
  );
}

function DashboardComponent() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-sv-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sv-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AuthenticatedDashboard user={user} />;
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardComponent />
    </AuthProvider>
  );
}



