import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BACProjectsList } from '@/components/bac/projects-list';
import { BarChart, PieChart } from '@/components/ui/charts';
import { Gavel, FileText, TrendingUp, Award, DollarSign, Building2 } from 'lucide-react';

export default async function BACDashboard() {
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

  // Allow BAC Secretariat and System Administrators
  if (userProfile?.role !== 'BAC_Secretariat' && userProfile?.role !== 'System_Administrator') {
    redirect('/dashboard');
  }

  // Fetch real statistics
  const { data: fundedProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('status', 'Funded');

  const { data: biddingProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('status', 'Open_For_Bidding');

  const { data: totalBids } = await supabase
    .from('bids')
    .select('id');

  const { data: awardedProjects } = await supabase
    .from('projects')
    .select('id')
    .in('status', ['In_Progress', 'Completed'])
    .not('contractor_id', 'is', null);

  const { data: bidsByStatus } = await supabase
    .from('bids')
    .select('is_winning_bid');

  const { data: projectsByStatus } = await supabase
    .from('projects')
    .select('status')
    .in('status', ['Funded', 'Open_For_Bidding', 'In_Progress']);

  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, company_name')
    .limit(10);

  const { data: bidInvitations } = await supabase
    .from('bid_invitations')
    .select('id');

  // Calculate statistics
  const fundedCount = fundedProjects?.length || 0;
  const biddingCount = biddingProjects?.length || 0;
  const totalBidsCount = totalBids?.length || 0;
  const awardedCount = awardedProjects?.length || 0;

  // Bid status distribution
  const winningBids = bidsByStatus?.filter(b => b.is_winning_bid).length || 0;
  const losingBids = (bidsByStatus?.length || 0) - winningBids;
  const bidStatusData = [
    { label: 'Winning Bids', value: winningBids, color: '#10b981' },
    { label: 'Other Bids', value: losingBids, color: '#6b7280' },
  ];

  // Project procurement status
  const statusCounts = projectsByStatus?.reduce((acc: any, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const procurementStatusData = [
    { label: 'Funded', value: statusCounts['Funded'] || 0 },
    { label: 'Open for Bidding', value: statusCounts['Open_For_Bidding'] || 0 },
    { label: 'In Progress', value: statusCounts['In_Progress'] || 0 },
  ];

  // Contractor participation (top 5)
  const { data: contractorBids } = await supabase
    .from('bids')
    .select('contractor_id, contractors(company_name)');

  const contractorCounts = contractorBids?.reduce((acc: any, bid: any) => {
    const name = bid.contractors?.company_name || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {}) || {};

  const contractorParticipation = Object.entries(contractorCounts)
    .map(([label, value]) => ({ label, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <DashboardLayout userRole={userProfile?.role} userEmail={user.email}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">BAC Procurement Dashboard</h2>
          <p className="text-muted-foreground mt-2">Manage bids, invitations, and contractor awards</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
            <div className="absolute top-4 right-4 opacity-10">
              <DollarSign className="h-16 w-16" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Funded Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {fundedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready for bidding</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
            <div className="absolute top-4 right-4 opacity-10">
              <Gavel className="h-16 w-16" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open for Bidding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-amber-800 bg-clip-text text-transparent">
                {biddingCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active bidding</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
            <div className="absolute top-4 right-4 opacity-10">
              <FileText className="h-16 w-16" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bids Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-purple-800 bg-clip-text text-transparent">
                {totalBidsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All submissions</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-green-500">
            <div className="absolute top-4 right-4 opacity-10">
              <Award className="h-16 w-16" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Awarded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-green-800 bg-clip-text text-transparent">
                {awardedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Contractors assigned</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Procurement Status */}
          <BarChart 
            title="Procurement Status"
            description="Projects by procurement stage"
            data={procurementStatusData}
          />

          {/* Bid Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Bid Distribution
              </CardTitle>
              <CardDescription>Winning vs total bids</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart 
                title="Bid Status"
                data={bidStatusData}
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalBidsCount > 0 ? ((winningBids / totalBidsCount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contractor Participation */}
        {contractorParticipation.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Top Contractor Participation
              </CardTitle>
              <CardDescription>Most active contractors by bid submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart 
                title="Contractor Participation"
                data={contractorParticipation} 
              />
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Bid Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bidInvitations?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Published invitations</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Registered Contractors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contractors?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active contractors</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Bids per Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(biddingCount + fundedCount) > 0 
                  ? (totalBidsCount / (biddingCount + fundedCount)).toFixed(1)
                  : '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Competition level</p>
            </CardContent>
          </Card>
        </div>

        {/* Contractor Participation */}
        {contractorParticipation.length > 0 && (
          <BarChart 
            title="Top Contractor Participation"
            description="Most active contractors by bid submissions"
            data={contractorParticipation}
          />
        )}

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-none">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Bid Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bidInvitations?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Published invitations</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-none">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Registered Contractors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contractors?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active contractors</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-none">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Avg Bids per Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(biddingCount + fundedCount) > 0 
                  ? (totalBidsCount / (biddingCount + fundedCount)).toFixed(1)
                  : '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Competition level</p>
            </CardContent>
          </Card>
        </div>

        {/* Funded Projects Ready for Bidding */}
        <Card>
          <CardHeader>
            <CardTitle>Funded Projects Ready for Bidding</CardTitle>
            <CardDescription>Create bid invitations for these projects</CardDescription>
          </CardHeader>
          <CardContent>
            <BACProjectsList status="Funded" stage="ready_for_bidding" />
          </CardContent>
        </Card>

        {/* Projects Open for Bidding */}
        <Card>
          <CardHeader>
            <CardTitle>Projects Open for Bidding</CardTitle>
            <CardDescription>Monitor bids and manage submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <BACProjectsList status="Open_For_Bidding" stage="bidding_open" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
