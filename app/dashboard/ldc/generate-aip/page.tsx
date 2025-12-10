import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AIPDocument } from '@/components/ldc/aip-document';

export default async function GenerateAIPPage() {
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

  // Allow Development Council and System Administrators
  if (userProfile?.role !== 'Development_Council' && userProfile?.role !== 'System_Administrator') {
    redirect('/dashboard');
  }

  const { data: prioritizedProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'Prioritized')
    .order('created_at', { ascending: false });

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
            <span className="text-sm text-muted-foreground">{userProfile?.first_name} {userProfile?.last_name}</span>
            <Link href="/auth/logout">
              <Button variant="ghost" size="sm">Logout</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Link href="/dashboard/ldc">
          <Button variant="ghost" className="gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="max-w-4xl">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-foreground">Annual Investment Program (AIP)</h2>
            <p className="text-muted-foreground mt-2">Generated AIP document with all prioritized projects</p>
          </div>

          <AIPDocument projects={prioritizedProjects || []} />
        </div>
      </main>
    </div>
  );
}
