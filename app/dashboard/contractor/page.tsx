'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Gavel, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Building2,
  ArrowRight,
  Trophy,
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

/**
 * Contractor Dashboard Page
 * @description Main dashboard for contractors to view available bids, submitted bids, and awarded projects
 * 
 * DSA Concepts Used:
 * - Array filtering: O(n) to categorize projects by status
 * - Hash Map: O(1) for status badge color lookup
 * - Infinite Scroll: Lazy loading pattern - O(k) per batch
 * - Intersection Observer: Browser API for efficient scroll detection - O(1)
 */

/** Number of items to load per batch for lazy loading */
const ITEMS_PER_PAGE = 6;

interface Project {
  id: string;
  title: string;
  description: string;
  barangay: string;
  project_category: string;
  estimated_cost: number;
  approved_budget_amount: number;
  status: string;
  created_at: string;
}

interface BidInvitation {
  id: string;
  project_id: string;
  title: string;
  description: string;
  bid_opening_date: string;
  bid_closing_date: string;
  pre_bid_conference_date: string;
  requirements: string;
}

interface OpenProject extends Project {
  bid_invitation?: BidInvitation | null;
}

interface Bid {
  id: string;
  project_id: string;
  bid_amount: number;
  bid_date: string;
  is_winning_bid: boolean;
  projects: Project;
}

interface Contractor {
  id: string;
  company_name: string;
  tin: string;
  contact_person: string;
  email: string;
  phone: string;
}

export default function ContractorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [openProjects, setOpenProjects] = useState<OpenProject[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [awardedProjects, setAwardedProjects] = useState<Project[]>([]);
  const [userProfile, setUserProfile] = useState<{ role: string } | null>(null);

  // Lazy loading state for each tab
  const [visibleOpenCount, setVisibleOpenCount] = useState(ITEMS_PER_PAGE);
  const [visibleBidsCount, setVisibleBidsCount] = useState(ITEMS_PER_PAGE);
  const [visibleAwardedCount, setVisibleAwardedCount] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('open-bids');

  // Refs for intersection observers
  const openLoadMoreRef = useRef<HTMLDivElement>(null);
  const bidsLoadMoreRef = useRef<HTMLDivElement>(null);
  const awardedLoadMoreRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  /**
   * Visible items for lazy loading
   * @description DSA: Array Slicing - O(k) where k = visible count
   */
  const visibleOpenProjects = useMemo(() => 
    openProjects.slice(0, visibleOpenCount), 
    [openProjects, visibleOpenCount]
  );
  
  const visibleMyBids = useMemo(() => 
    myBids.slice(0, visibleBidsCount), 
    [myBids, visibleBidsCount]
  );
  
  const visibleAwardedProjects = useMemo(() => 
    awardedProjects.slice(0, visibleAwardedCount), 
    [awardedProjects, visibleAwardedCount]
  );

  // Check if there are more items to load
  const hasMoreOpen = visibleOpenCount < openProjects.length;
  const hasMoreBids = visibleBidsCount < myBids.length;
  const hasMoreAwarded = visibleAwardedCount < awardedProjects.length;

  /**
   * Load more callback for each tab
   * @description DSA: Incremental Loading / Chunking
   */
  const loadMoreOpen = useCallback(() => {
    if (loadingMore || !hasMoreOpen) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleOpenCount(prev => Math.min(prev + ITEMS_PER_PAGE, openProjects.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMoreOpen, openProjects.length]);

  const loadMoreBids = useCallback(() => {
    if (loadingMore || !hasMoreBids) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleBidsCount(prev => Math.min(prev + ITEMS_PER_PAGE, myBids.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMoreBids, myBids.length]);

  const loadMoreAwarded = useCallback(() => {
    if (loadingMore || !hasMoreAwarded) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleAwardedCount(prev => Math.min(prev + ITEMS_PER_PAGE, awardedProjects.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMoreAwarded, awardedProjects.length]);

  /**
   * Intersection Observer for infinite scroll on Open Bids tab
   */
  useEffect(() => {
    if (activeTab !== 'open-bids') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreOpen && !loadingMore) {
          loadMoreOpen();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    const currentRef = openLoadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [hasMoreOpen, loadingMore, loadMoreOpen, activeTab]);

  /**
   * Intersection Observer for My Bids tab
   */
  useEffect(() => {
    if (activeTab !== 'my-bids') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreBids && !loadingMore) {
          loadMoreBids();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    const currentRef = bidsLoadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [hasMoreBids, loadingMore, loadMoreBids, activeTab]);

  /**
   * Intersection Observer for Awarded tab
   */
  useEffect(() => {
    if (activeTab !== 'awarded') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreAwarded && !loadingMore) {
          loadMoreAwarded();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    const currentRef = awardedLoadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [hasMoreAwarded, loadingMore, loadMoreAwarded, activeTab]);

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Fetches all contractor-related data
   * @description Fetches projects with Open_For_Bidding status directly,
   * then enriches with bid_invitations data if available
   */
  const fetchData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      // Get contractor profile linked to this user (by email)
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('*')
        .eq('email', user.email)
        .single();

      setContractor(contractorData);

      // Fetch ALL projects that are Open for Bidding
      const { data: openProjectsData, error: openError } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'Open_For_Bidding')
        .order('created_at', { ascending: false });

      if (openError) {
        console.error('Error fetching open projects:', openError);
      }

      // Fetch bid invitations to enrich the project data
      const { data: invitations } = await supabase
        .from('bid_invitations')
        .select('*');

      // Create a map of project_id -> bid_invitation for O(1) lookup
      const invitationMap = new Map<string, BidInvitation>();
      if (invitations) {
        invitations.forEach((inv: BidInvitation) => {
          invitationMap.set(inv.project_id, inv);
        });
      }

      // Enrich open projects with bid invitation data
      const enrichedProjects: OpenProject[] = (openProjectsData || []).map((project: Project) => ({
        ...project,
        bid_invitation: invitationMap.get(project.id) || null,
      }));

      setOpenProjects(enrichedProjects);

      // Fetch bids submitted by this contractor
      if (contractorData) {
        const { data: bidsData } = await supabase
          .from('bids')
          .select(`
            *,
            projects (
              id, title, description, barangay, project_category,
              estimated_cost, approved_budget_amount, status, created_at
            )
          `)
          .eq('contractor_id', contractorData.id)
          .order('bid_date', { ascending: false });

        setMyBids(bidsData || []);

        // Fetch awarded projects (where contractor won the bid)
        const { data: awarded } = await supabase
          .from('projects')
          .select('*')
          .eq('contractor_id', contractorData.id)
          .in('status', ['In_Progress', 'Completed', 'Funded']);

        setAwardedProjects(awarded || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format currency to Philippine Peso
   * @param amount - Number to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  /**
   * Format date to readable string
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Get badge variant based on bid status
   * @description O(1) Hash Map lookup for status colors
   */
  const getBidStatusBadge = (bid: Bid) => {
    if (bid.is_winning_bid) {
      return <Badge className="bg-green-500">Won</Badge>;
    }
    // Check if project already has a winner
    const projectStatus = bid.projects?.status;
    if (projectStatus === 'In_Progress' || projectStatus === 'Completed') {
      return <Badge variant="destructive">Not Selected</Badge>;
    }
    return <Badge variant="secondary">Pending Review</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Check role access
  if (userProfile?.role !== 'Contractor' && userProfile?.role !== 'System_Administrator') {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contractor Dashboard</h1>
          <p className="text-muted-foreground">
            View available bids, submit proposals, and track your awarded projects
          </p>
        </div>

        {/* Admin Mode Banner */}
        {userProfile?.role === 'System_Administrator' && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">Admin Mode</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    You&apos;re viewing the Contractor dashboard as an administrator. You can submit bids on behalf of any registered contractor.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contractor Profile Card - Only show for actual contractors */}
        {userProfile?.role === 'Contractor' && contractor && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{contractor.company_name}</CardTitle>
                  <CardDescription>TIN: {contractor.tin}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{contractor.contact_person}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{contractor.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{contractor.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active Bids</p>
                  <p className="font-medium">{myBids.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No contractor warning - only for actual Contractor role */}
        {userProfile?.role === 'Contractor' && !contractor && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <p className="text-center text-yellow-700 dark:text-yellow-300">
                ⚠️ No contractor profile found. Please contact the BAC Secretariat to register your company.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openProjects.length}</div>
              <p className="text-xs text-muted-foreground">Available for bidding</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Submitted Bids</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myBids.length}</div>
              <p className="text-xs text-muted-foreground">Total bids submitted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Bids</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {myBids.filter(b => b.is_winning_bid).length}
              </div>
              <p className="text-xs text-muted-foreground">Contracts awarded</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{awardedProjects.length}</div>
              <p className="text-xs text-muted-foreground">Projects in progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="open-bids" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="open-bids">
              <FileText className="h-4 w-4 mr-2" />
              Open for Bidding ({openProjects.length})
            </TabsTrigger>
            <TabsTrigger value="my-bids">
              <Gavel className="h-4 w-4 mr-2" />
              My Bids ({myBids.length})
            </TabsTrigger>
            <TabsTrigger value="awarded">
              <Trophy className="h-4 w-4 mr-2" />
              Awarded Projects ({awardedProjects.length})
            </TabsTrigger>
          </TabsList>

          {/* Open Projects Tab */}
          <TabsContent value="open-bids" className="space-y-4">
            {openProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No projects open for bidding at the moment. Check back later!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Results count */}
                <p className="text-sm text-muted-foreground">
                  Showing {visibleOpenProjects.length} of {openProjects.length} projects
                </p>
                
                <div className="grid gap-4">
                  {visibleOpenProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                            <CardDescription>{project.barangay} • {project.project_category?.replace(/_/g, ' ')}</CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Open for Bidding
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground">Approved Budget</p>
                            <p className="font-medium text-green-600">
                              {formatCurrency(project.approved_budget_amount || project.estimated_cost || 0)}
                            </p>
                          </div>
                          {project.bid_invitation ? (
                            <>
                              <div>
                                <p className="text-muted-foreground">Bid Opening</p>
                                <p className="font-medium">{formatDate(project.bid_invitation.bid_opening_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Bid Closing</p>
                                <p className="font-medium text-red-600">{formatDate(project.bid_invitation.bid_closing_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Days Left</p>
                                <p className="font-medium">
                                  {Math.max(0, Math.ceil((new Date(project.bid_invitation.bid_closing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-muted-foreground">Estimated Cost</p>
                                <p className="font-medium">{formatCurrency(project.estimated_cost || 0)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Category</p>
                                <p className="font-medium">{project.project_category?.replace(/_/g, ' ')}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant="secondary">Awaiting Invitation</Badge>
                              </div>
                            </>
                          )}
                        </div>
                        {project.bid_invitation?.requirements && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">Requirements:</p>
                            <p className="text-sm">{project.bid_invitation.requirements}</p>
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Link href={`/dashboard/contractor/submit-bid/${project.id}`}>
                            <Button disabled={userProfile?.role === 'Contractor' && !contractor}>
                              Submit Bid <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Lazy Load Sentinel */}
                <div ref={openLoadMoreRef} className="py-4 flex justify-center">
                  {loadingMore && activeTab === 'open-bids' ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  ) : hasMoreOpen ? (
                    <p className="text-sm text-muted-foreground">Scroll for more projects</p>
                  ) : openProjects.length > ITEMS_PER_PAGE ? (
                    <p className="text-sm text-muted-foreground">All {openProjects.length} projects loaded</p>
                  ) : null}
                </div>
              </>
            )}
          </TabsContent>

          {/* My Bids Tab */}
          <TabsContent value="my-bids" className="space-y-4">
            {myBids.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    You haven&apos;t submitted any bids yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Results count */}
                <p className="text-sm text-muted-foreground">
                  Showing {visibleMyBids.length} of {myBids.length} bids
                </p>

                <div className="grid gap-4">
                  {visibleMyBids.map((bid) => (
                    <Card key={bid.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{bid.projects?.title}</CardTitle>
                            <CardDescription>{bid.projects?.barangay} • {bid.projects?.project_category}</CardDescription>
                          </div>
                          {getBidStatusBadge(bid)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Your Bid Amount</p>
                            <p className="font-medium text-lg">{formatCurrency(bid.bid_amount)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Project Budget</p>
                            <p className="font-medium">
                              {formatCurrency(bid.projects?.approved_budget_amount || bid.projects?.estimated_cost || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Submitted On</p>
                            <p className="font-medium">{formatDate(bid.bid_date)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Project Status</p>
                            <Badge variant="outline">{bid.projects?.status?.replace(/_/g, ' ')}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Lazy Load Sentinel */}
                <div ref={bidsLoadMoreRef} className="py-4 flex justify-center">
                  {loadingMore && activeTab === 'my-bids' ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  ) : hasMoreBids ? (
                    <p className="text-sm text-muted-foreground">Scroll for more bids</p>
                  ) : myBids.length > ITEMS_PER_PAGE ? (
                    <p className="text-sm text-muted-foreground">All {myBids.length} bids loaded</p>
                  ) : null}
                </div>
              </>
            )}
          </TabsContent>

          {/* Awarded Projects Tab */}
          <TabsContent value="awarded" className="space-y-4">
            {awardedProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No awarded projects yet. Keep submitting competitive bids!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Results count */}
                <p className="text-sm text-muted-foreground">
                  Showing {visibleAwardedProjects.length} of {awardedProjects.length} awarded projects
                </p>

                <div className="grid gap-4">
                  {visibleAwardedProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow border-green-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                            <CardDescription>{project.barangay} • {project.project_category}</CardDescription>
                          </div>
                          <Badge className="bg-green-500">
                            <Trophy className="h-3 w-3 mr-1" /> Awarded
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground">Contract Amount</p>
                            <p className="font-medium text-lg text-green-600">
                              {formatCurrency(project.approved_budget_amount || project.estimated_cost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <Badge variant="outline">{project.status?.replace(/_/g, ' ')}</Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Awarded Date</p>
                            <p className="font-medium">{formatDate(project.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Link href={`/projects/${project.id}`}>
                            <Button variant="outline">
                              View Project <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Lazy Load Sentinel */}
                <div ref={awardedLoadMoreRef} className="py-4 flex justify-center">
                  {loadingMore && activeTab === 'awarded' ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  ) : hasMoreAwarded ? (
                    <p className="text-sm text-muted-foreground">Scroll for more projects</p>
                  ) : awardedProjects.length > ITEMS_PER_PAGE ? (
                    <p className="text-sm text-muted-foreground">All {awardedProjects.length} projects loaded</p>
                  ) : null}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
