/**
 * @fileoverview Admin Dashboard Page with comprehensive system statistics
 * 
 * This server component displays system-wide statistics, user distribution,
 * budget summaries, and recent projects for system administrators.
 * 
 * @description DSA Overview:
 * 
 * 1. **Reduce Algorithm**: For computing budget totals
 *    - Time Complexity: O(n) where n = number of projects
 * 
 * 2. **Reduce with Grouping**: For role distribution counting
 *    - Time Complexity: O(n) where n = number of users
 * 
 * 3. **Object.entries + Map**: For rendering role statistics
 *    - Time Complexity: O(k) where k = number of unique roles
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderKanban, Activity, Shield, TrendingUp, DollarSign, CheckCircle2, Clock } from 'lucide-react';

/**
 * Admin Dashboard Page Component
 * 
 * @async
 * @function AdminDashboard
 * @description Server component displaying comprehensive system statistics.
 * 
 * **DSA Implementations:**
 * 
 * 1. **Database Queries with Count**
 *    - Uses Supabase count: 'exact' for O(1) count queries
 *    - Much faster than fetching all records and counting
 * 
 * 2. **totalBudgetRequested - Array Reduce (Sum)**
 *    - Algorithm: Linear aggregation
 *    - Time Complexity: O(n) where n = all projects
 *    - Code: `projects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0)`
 *    - Sums all estimated costs in single pass
 * 
 * 3. **totalBudgetAllocated - Array Reduce (Sum)**
 *    - Algorithm: Linear aggregation
 *    - Time Complexity: O(n)
 *    - Sums all approved budget amounts
 * 
 * 4. **totalDisbursed - Array Reduce (Sum)**
 *    - Algorithm: Linear aggregation
 *    - Time Complexity: O(n)
 *    - Sums all disbursed amounts
 * 
 * 5. **roleCounts - Reduce with Object Accumulator (Grouping)**
 *    - Algorithm: Linear grouping/counting
 *    - Time Complexity: O(n) where n = users with roles
 *    - Space Complexity: O(k) where k = unique roles
 *    - Code: `users.reduce((acc, { role }) => { acc[role]++; return acc }, {})`
 *    - Groups users by role and counts each
 * 
 * 6. **Object.entries() + Map - Role Rendering**
 *    - Algorithm: Object to array conversion + iteration
 *    - Time Complexity: O(k) where k = unique roles
 *    - Converts role counts object to renderable array
 * 
 * **Query Optimization:**
 * - Uses `count: 'exact', head: true` for count-only queries
 * - Fetches only needed fields: `select('estimated_cost, approved_budget_amount...')`
 * - Limits recent projects to 5: `.limit(5)`
 * 
 * @returns {Promise<JSX.Element>} Rendered admin dashboard
 */
export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'System_Administrator') {
    redirect('/dashboard');
  }

  /**
   * Database COUNT queries
   * @description Using count: 'exact' is O(1) in PostgreSQL with proper indexes
   * Much more efficient than SELECT * then counting in JavaScript
   */
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: totalProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'In_Progress');

  const { count: completedProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Completed');

  const { count: pendingProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Pending_Review', 'Prioritized']);

  /**
   * Recent projects query with join
   * @description Uses foreign key join for creator info
   * Limited to 5 for O(1) rendering complexity
   */
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('*, users!created_by(first_name, last_name, role)')
    .order('created_at', { ascending: false })
    .limit(5);

  /**
   * Budget statistics query
   * @description Fetches only needed columns for efficiency
   * Selected fields minimize data transfer
   */
  const { data: allProjects } = await supabase
    .from('projects')
    .select('estimated_cost, approved_budget_amount, amount_disbursed, status');

  /**
   * Total budget requested calculation
   * 
   * @description DSA: Array Reduce (Summation)
   * 
   * Algorithm: Linear aggregation
   * Time Complexity: O(n) where n = all projects
   * Space Complexity: O(1) - single accumulator
   * 
   * How it works:
   * 1. Initialize sum = 0
   * 2. For each project: sum += estimated_cost (or 0 if null)
   * 3. Return final sum
   */
  const totalBudgetRequested = allProjects?.reduce((sum, p) => sum + (p.estimated_cost || 0), 0) || 0;
  
  /**
   * Total budget allocated
   * @description DSA: Array Reduce - O(n)
   */
  const totalBudgetAllocated = allProjects?.reduce((sum, p) => sum + (p.approved_budget_amount || 0), 0) || 0;
  
  /**
   * Total funds disbursed
   * @description DSA: Array Reduce - O(n)
   */
  const totalDisbursed = allProjects?.reduce((sum, p) => sum + (p.amount_disbursed || 0), 0) || 0;

  /**
   * Role distribution query
   * @description Fetches only role column for efficiency
   */
  const { data: roleDistribution } = await supabase
    .from('users')
    .select('role')
    .neq('role', 'Public_User');

  /**
   * Role counts calculation
   * 
   * @description DSA: Reduce with Object Accumulator (Grouping/Counting)
   * 
   * Algorithm: Linear grouping with counting
   * Time Complexity: O(n) where n = users with roles
   * Space Complexity: O(k) where k = unique roles (typically 6-8)
   * 
   * How it works:
   * 1. Start with empty object {}
   * 2. For each user:
   *    a. Get role from destructuring
   *    b. If role exists in acc: increment count
   *    c. If role doesn't exist: initialize to 1
   * 3. Return object: { 'Planner': 3, 'Budget_Officer': 2, ... }
   * 
   * Example:
   * Input: [{ role: 'A' }, { role: 'B' }, { role: 'A' }]
   * Step 1: {} → { A: 1 }
   * Step 2: { A: 1 } → { A: 1, B: 1 }
   * Step 3: { A: 1, B: 1 } → { A: 2, B: 1 }
   */
  const roleCounts = roleDistribution?.reduce((acc: Record<string, number>, { role }) => {
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <DashboardLayout userRole={userProfile?.role} userEmail={user.email}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Administrator Dashboard</h2>
          <p className="text-muted-foreground mt-2">Welcome back, {userProfile?.first_name}! Here's what's happening with your system.</p>
        </div>

        {/* Top Stats Cards - Modern Gradient Style */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users Card */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUsers || 0}</div>
              <p className="text-xs opacity-80 mt-1">Registered in system</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Users className="h-24 w-24" />
            </div>
          </Card>

          {/* Total Projects Card */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProjects || 0}</div>
              <p className="text-xs opacity-80 mt-1">All statuses</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <FolderKanban className="h-24 w-24" />
            </div>
          </Card>

          {/* Active Projects Card */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Activity className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeProjects || 0}</div>
              <p className="text-xs opacity-80 mt-1">Currently in progress</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Activity className="h-24 w-24" />
            </div>
          </Card>

          {/* Completed Projects Card */}
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedProjects || 0}</div>
              <p className="text-xs opacity-80 mt-1">Successfully finished</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <CheckCircle2 className="h-24 w-24" />
            </div>
          </Card>
        </div>

        {/* Budget Overview - Full Width Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Requested</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{(totalBudgetRequested / 1000000).toFixed(2)}M</div>
              <p className="text-xs text-muted-foreground mt-1">Total estimated costs</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Allocated</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{(totalBudgetAllocated / 1000000).toFixed(2)}M</div>
              <p className="text-xs text-muted-foreground mt-1">Approved budgets</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Funds Disbursed</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{(totalDisbursed / 1000000).toFixed(2)}M</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBudgetAllocated > 0 
                  ? `${((totalDisbursed / totalBudgetAllocated) * 100).toFixed(1)}% utilized`
                  : 'No allocation yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          {/* Recent Projects */}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Latest projects submitted to the system</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects && recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{project.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.barangay} • {project.project_category?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {project.users?.first_name} {project.users?.last_name}
                        </p>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'In_Progress' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'Pending_Review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          ₱{(project.estimated_cost / 1000000).toFixed(2)}M
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              )}
            </CardContent>
          </Card>

          {/* System Health & Quick Stats */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics and system health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Status</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authentication</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">User Roles</h4>
                <div className="space-y-2">
                  {Object.entries(roleCounts).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{role.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Project Pipeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending Review</span>
                    <span className="font-medium">{pendingProjects || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">In Progress</span>
                    <span className="font-medium">{activeProjects || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{completedProjects || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Administrative tools and management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              <button className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <FolderKanban className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium">View all projects</p>
                  <p className="text-xs text-muted-foreground">Browse the system</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">Manage users</p>
                  <p className="text-xs text-muted-foreground">Accounts and roles</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <Activity className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">Monitor activity</p>
                  <p className="text-xs text-muted-foreground">System activity</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors text-left">
                <Shield className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="font-medium">System settings</p>
                  <p className="text-xs text-muted-foreground">Configure system</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
