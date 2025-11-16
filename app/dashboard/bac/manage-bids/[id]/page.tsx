import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ManageBidsForm } from '@/components/bac/manage-bids-form';

export default async function ManageBidsPage({
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

  if (userProfile?.role !== 'BAC_Secretariat') {
    redirect('/dashboard');
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (!project) {
    redirect('/dashboard/bac');
  }

  const { data: bids } = await supabase
    .from('bids')
    .select(`
      id,
      bid_amount,
      bid_date,
      is_winning_bid,
      contractor_id,
      contractors!inner (
        id,
        company_name,
        contact_person,
        email,
        phone
      )
    `)
    .eq('project_id', id)
    .order('bid_amount', { ascending: true });

  // Transform the data to match the expected type
  const transformedBids = bids?.map((bid: any) => ({
    ...bid,
    contractors: Array.isArray(bid.contractors) ? bid.contractors[0] : bid.contractors
  })) || [];

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
        <Link href="/dashboard/bac">
          <Button variant="ghost" className="gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="max-w-6xl">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-foreground">Manage Bids</h2>
            <p className="text-muted-foreground mt-2">{project.title}</p>
          </div>

          <ManageBidsForm project={project} bids={transformedBids} userId={user.id} />
        </div>
      </main>
    </div>
  );
}
