import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProjectMonitoringDashboard } from '@/components/inspector/project-monitoring-dashboard';

export default async function ProjectMonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Allow Technical Inspector and System Administrators
  if (userProfile?.role !== 'Technical_Inspector' && userProfile?.role !== 'System_Administrator') {
    redirect('/dashboard');
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', id)
    .order('order_sequence', { ascending: true });

  const { data: updates } = await supabase
    .from('project_updates')
    .select(`
      *,
      users (
        first_name,
        last_name,
        email
      )
    `)
    .eq('project_id', id)
    .order('submitted_at', { ascending: false });

  if (!project) {
    redirect('/dashboard/inspector');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">BuildTrack-LGU</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Inspector</span>
            <Link href="/auth/logout">
              <Button variant="ghost" size="sm">Logout</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Link href="/dashboard/inspector">
          <Button variant="ghost" className="gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <ProjectMonitoringDashboard project={project} milestones={milestones || []} updates={updates || []} userId={user.id} />
      </main>
    </div>
  );
}
