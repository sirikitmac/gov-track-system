import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BudgetAllocationForm } from '@/components/budget/allocation-form';

export default async function AllocateBudgetPage({
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

  // Allow Budget Officers and System Administrators
  if (userProfile?.role !== 'Budget_Officer' && userProfile?.role !== 'System_Administrator') {
    redirect('/dashboard');
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  // Allow Prioritized (for initial allocation) and Funded/Open_For_Bidding/In_Progress (for updates)
  const allowedStatuses = ['Prioritized', 'Funded', 'Open_For_Bidding', 'In_Progress'];
  if (!project || !allowedStatuses.includes(project.status)) {
    redirect('/dashboard/budget');
  }

  // Determine if this is an update or initial allocation
  const isUpdate = project.status !== 'Prioritized';

  return (
    <DashboardLayout userRole={userProfile?.role} userEmail={user.email}>
      <div className="space-y-6">
        <Link href="/dashboard/budget">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div>
          <h2 className="text-3xl font-bold">{isUpdate ? 'Update Budget' : 'Allocate Budget'}</h2>
          <p className="text-muted-foreground mt-2">{project.title}</p>
        </div>

        <BudgetAllocationForm project={project} userId={user.id} isUpdate={isUpdate} />
      </div>
    </DashboardLayout>
  );
}
