"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";
import { 
  Users, 
  Activity, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  Zap
} from "lucide-react";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface HistoryItem {
  timestamp: string;
  repoName: string;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  credits: number;
  accessRequested: boolean;
  createdAt: string;
  updatedAt: string;
  history?: HistoryItem[];
  image?: string; // Optional: if we want to show avatar from auth provider (not currently in schema but good to have)
}

interface DashboardStats {
  totalUsers: number;
  totalGenerations: number;
  pendingRequests: number;
  activeRecently: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Computed Stats
  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      totalGenerations: users.reduce((acc, user) => acc + (user.history?.length || 0), 0),
      pendingRequests: users.filter(u => u.accessRequested).length,
      activeRecently: users.filter(u => new Date(u.updatedAt) > oneDayAgo).length
    };
  }, [users]);

  // Computed Graph Data (Last 7 Days)
  const graphData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: format(d, "MMM dd"),
        fullDate: d,
        count: 0
      };
    });

    users.forEach(user => {
      user.history?.forEach(h => {
        const hDate = new Date(h.timestamp);
        const dayStat = last7Days.find(d => 
          isWithinInterval(hDate, { start: startOfDay(d.fullDate), end: endOfDay(d.fullDate) })
        );
        if (dayStat) {
          dayStat.count++;
        }
      });
    });

    return last7Days;
  }, [users]);

  useEffect(() => {
    if (status === "loading") return;
    
    // Auth Check
    if (
      status === "unauthenticated" ||
      (session?.user?.username !== "Dev-Shivam-05" && session?.user?.name !== "Dev-Shivam-05")
    ) {
      router.push("/");
      return;
    }

    fetchUsers();
  }, [status, session, router]);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const res = await apiClient.get("/admin/users");
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGrantCredit = async (userId: string) => {
    try {
      await apiClient.post("/admin/approve", { userId });
      toast.success("Credit granted (+1)");
      
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, credits: u.credits + 1, accessRequested: false }
            : u
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to grant credit");
    }
  };

  // Placeholder for delete functionality (backend route needed)
  const handleDeleteUser = async (userId: string) => {
     if(!confirm("Are you sure you want to delete this user?")) return;
     console.log("Delete user:", userId);
     toast.error("Delete functionality not yet implemented in API");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
           <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm">
            <Image
              src="/logo.jpeg"
              alt="Logo"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Admin Cockpit
            </h1>
            <p className="text-muted-foreground text-sm">System Overview & User Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchUsers} 
            disabled={refreshing}
            className="h-9"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            Exit to App
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* SECTION 1: STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon={<Users className="h-5 w-5 text-blue-500" />} 
            description="Registered accounts"
          />
          <StatsCard 
            title="Total Generations" 
            value={stats.totalGenerations} 
            icon={<Zap className="h-5 w-5 text-yellow-500" />} 
            description="Commits pushed"
          />
          <StatsCard 
            title="Pending Requests" 
            value={stats.pendingRequests} 
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />} 
            description="Awaiting approval"
            highlight={stats.pendingRequests > 0}
          />
          <StatsCard 
            title="Active Recently" 
            value={stats.activeRecently} 
            icon={<Activity className="h-5 w-5 text-green-500" />} 
            description="Last 24 hours"
          />
        </div>

        {/* SECTION 2: ACTIVITY GRAPH */}
        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Generation Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                  dy={10}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {graphData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? "hsl(var(--primary))" : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SECTION 3: THE CONTROL TABLE */}
        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle className="text-lg font-medium">User Database</CardTitle>
            <CardDescription>Manage access and view user details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">User</th>
                    <th className="px-6 py-4">Credits</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {user.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{user.username}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full text-xs font-medium ${
                            user.credits > 0 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {user.credits}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.accessRequested ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        ) : user.credits > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.accessRequested || user.credits === 0 ? (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                              onClick={() => handleGrantCredit(user._id)}
                            >
                              Grant +1
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled className="opacity-50">
                              Granted
                            </Button>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No users found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  description, 
  highlight = false 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`shadow-sm transition-all duration-200 ${highlight ? 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
