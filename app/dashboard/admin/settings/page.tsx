import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Mail, 
  Globe, 
  Lock,
  Server,
  FileText,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default async function SystemSettings() {
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

  return (
    <DashboardLayout userRole={userProfile?.role} userEmail={user.email}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground mt-2">Configure and manage system-wide settings</p>
        </div>

        {/* System Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <CheckCircle2 className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Operational</div>
              <p className="text-xs opacity-80 mt-1">All systems running</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <CheckCircle2 className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Connected</div>
              <p className="text-xs opacity-80 mt-1">Supabase PostgreSQL</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Database className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authentication</CardTitle>
              <Shield className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs opacity-80 mt-1">JWT-based auth</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Shield className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <Server className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs opacity-80 mt-1">File storage ready</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Server className="h-24 w-24" />
            </div>
          </Card>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <CardTitle>General Settings</CardTitle>
              </div>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system-name">System Name</Label>
                <Input id="system-name" defaultValue="LGU Project Tracking System" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" defaultValue="Local Government Unit" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="Asia/Manila" />
              </div>
              <Button className="w-full">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                <CardTitle>Security Settings</CardTitle>
              </div>
              <CardDescription>Authentication and security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">Require 2FA for admin users</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Password Policy</Label>
                  <p className="text-xs text-muted-foreground">Minimum 8 characters required</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <Badge variant="outline">24 hours</Badge>
              </div>
              <Button variant="outline" className="w-full">Configure Security</Button>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-500" />
                <CardTitle>Email Settings</CardTitle>
              </div>
              <CardDescription>Email notifications and SMTP configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" defaultValue="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email</Label>
                <Input id="from-email" placeholder="noreply@lgu.gov.ph" />
              </div>
              <Button className="w-full">Update Email Settings</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>Configure system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Project Notifications</Label>
                  <p className="text-xs text-muted-foreground">Notify when projects are created</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">On</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Change Alerts</Label>
                  <p className="text-xs text-muted-foreground">Alert on project status updates</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">On</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Budget Notifications</Label>
                  <p className="text-xs text-muted-foreground">Notify on budget allocations</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">On</Badge>
              </div>
              <Button variant="outline" className="w-full">Manage Notifications</Button>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-500" />
              <CardTitle>System Information</CardTitle>
            </div>
            <CardDescription>Technical details and version information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">System Version:</span>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Framework:</span>
                  <Badge variant="outline">Next.js 14</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Database:</span>
                  <Badge variant="outline">Supabase PostgreSQL</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Node Version:</span>
                  <Badge variant="outline">v20.x</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-sm text-muted-foreground">Nov 17, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Environment:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Production</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">API Status:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Uptime:</span>
                  <span className="text-sm text-muted-foreground">99.9%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-900">Maintenance & Backup</CardTitle>
            </div>
            <CardDescription>System maintenance and data backup tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-3">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Backup Database
              </Button>
              <Button variant="outline" className="w-full">
                <Server className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Maintenance Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
