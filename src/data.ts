export type PaymentStatus = "Paid" | "Unpaid" | "Pending" | "Not Interested";

export interface Member {
  id: string;
  name: string;
  usn: string;
  amount: number;
  status: PaymentStatus;
  date?: string;
  createdAt?: any;
  updatedAt?: any;
  avatarInitials?: string;
  proofUrl?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: string | number;
  createdAt?: any;
  type: "upload" | "status_change" | "budget" | "add_member";
}

export const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "Rahul Kumar", usn: "1RV21CS001", amount: 300, status: "Paid", date: "May 12, 2026", avatarInitials: "RK", proofUrl: "https://images.unsplash.com/photo-1544390022-300e84ec81fc?w=400&q=80" },
  { id: "2", name: "Aman Singh", usn: "1RV21CS002", amount: 300, status: "Paid", date: "May 12, 2026", avatarInitials: "AS", proofUrl: "https://images.unsplash.com/photo-1544390022-300e84ec81fc?w=400&q=80" },
  { id: "3", name: "Vikas Patel", usn: "1RV21CS003", amount: 300, status: "Pending", date: "May 11, 2026", avatarInitials: "VP" },
  { id: "4", name: "Sagar Sharma", usn: "1RV21CS004", amount: 300, status: "Unpaid", date: "May 11, 2026", avatarInitials: "SS" },
  { id: "5", name: "Pranav Joshi", usn: "1RV21CS005", amount: 300, status: "Unpaid", date: "May 10, 2026", avatarInitials: "PJ" },
  { id: "6", name: "Neeraj Yadav", usn: "1RV21CS006", amount: 300, status: "Paid", date: "May 10, 2026", avatarInitials: "NY", proofUrl: "https://images.unsplash.com/photo-1544390022-300e84ec81fc?w=400&q=80" },
  { id: "7", name: "Karan Mehta", usn: "1RV21CS007", amount: 300, status: "Pending", date: "May 09, 2026", avatarInitials: "KM" },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: "a1", user: "Rahul Kumar", action: "uploaded payment proof", timestamp: "May 12, 2026 • 10:30 AM", type: "upload" },
  { id: "a2", user: "Aman Singh", action: "marked as paid", timestamp: "May 12, 2026 • 09:45 AM", type: "status_change" },
  { id: "a3", user: "Admin", action: "Budget updated", timestamp: "May 11, 2026 • 07:20 PM", type: "budget" },
  { id: "a4", user: "Sagar Sharma", action: "added to unpaid list", timestamp: "May 11, 2026 • 06:15 PM", type: "add_member" },
];

export const STATS = {
  totalMembers: 128,
  paidMembers: 97,
  unpaidMembers: 31,
  totalCollected: 29100,
  pendingAmount: 9300,
  totalBudget: 38400,
};
