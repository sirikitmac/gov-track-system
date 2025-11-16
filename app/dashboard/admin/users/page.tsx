import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Shield, Mail, Calendar, Activity } from 'lucide-react';
import { UsersDataTable } from '@/components/admin/users-data-table';

export default async function UsersManagement() {
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

  // Get all users with their details
  const { data: allUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  // Get role statistics
  const roleCounts = allUsers?.reduce((acc: Record<string, number>, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {}) || {};

  // Get recent signups (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSignups = allUsers?.filter(u => new Date(u.created_at) > thirtyDaysAgo).length || 0;

  const roleColors: Record<string, string> = {
    'System_Administrator': 'bg-red-100 text-red-800 border-red-200',
    'Planner': 'bg-blue-100 text-blue-800 border-blue-200',
    'Development_Council': 'bg-purple-100 text-purple-800 border-purple-200',
    'Budget_Officer': 'bg-green-100 text-green-800 border-green-200',
    'BAC_Secretariat': 'bg-amber-100 text-amber-800 border-amber-200',
    'Technical_Inspector': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'Contractor': 'bg-orange-100 text-orange-800 border-orange-200',
    'Public_User': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <DashboardLayout userRole={userProfile?.role} userEmail={user.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground mt-2">Manage user accounts and roles across the system</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allUsers?.length || 0}</div>
              <p className="text-xs opacity-80 mt-1">Registered accounts</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Users className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
              <Activity className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{recentSignups}</div>
              <p className="text-xs opacity-80 mt-1">Last 30 days</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Activity className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Shield className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{roleCounts['System_Administrator'] || 0}</div>
              <p className="text-xs opacity-80 mt-1">System administrators</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Shield className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <Users className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(allUsers?.length || 0) - (roleCounts['Public_User'] || 0)}
              </div>
              <p className="text-xs opacity-80 mt-1">Staff accounts</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Users className="h-24 w-24" />
            </div>
          </Card>
        </div>

        {/* Role Distribution */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
              <CardDescription>User counts by role type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(roleCounts).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${
                        role === 'System_Administrator' ? 'bg-red-500' :
                        role === 'Planner' ? 'bg-blue-500' :
                        role === 'Development_Council' ? 'bg-purple-500' :
                        role === 'Budget_Officer' ? 'bg-green-500' :
                        role === 'BAC_Secretariat' ? 'bg-amber-500' :
                        role === 'Technical_Inspector' ? 'bg-cyan-500' :
                        role === 'Contractor' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm font-medium">{role.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{count}</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            role === 'System_Administrator' ? 'bg-red-500' :
                            role === 'Planner' ? 'bg-blue-500' :
                            role === 'Development_Council' ? 'bg-purple-500' :
                            role === 'Budget_Officer' ? 'bg-green-500' :
                            role === 'BAC_Secretariat' ? 'bg-amber-500' :
                            role === 'Technical_Inspector' ? 'bg-cyan-500' :
                            role === 'Contractor' ? 'bg-orange-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${((count / (allUsers?.length || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common user management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-2" />
                Create New User Account
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Manage User Roles
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Bulk Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                View User Activity Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Complete list of registered users with search and filtering</CardDescription>
          </CardHeader>
          <CardContent>
            <UsersDataTable data={allUsers || []} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
