'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  DollarSign, 
  FileText,
  MapPin,
  Send,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

/**
 * Submit Bid Page
 * @description Allows contractors to submit their bid proposal for a project
 * System Administrators can select from existing contractors to test the flow.
 * 
 * DSA Concepts Used:
 * - Form validation: O(1) for each field check
 * - Database query: O(1) with indexed lookups
 * - Array mapping: O(n) for contractor dropdown
 */

interface Project {
  id: string;
  title: string;
  description: string;
  barangay: string;
  project_category: string;
  estimated_cost: number;
  approved_budget_amount: number;
  status: string;
  problem_description: string;
  proposed_solution: string;
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
  minimum_bid_amount: number;
  maximum_bid_amount: number;
}

interface Contractor {
  id: string;
  company_name: string;
  tin: string;
  contact_person: string;
  email: string;
  phone: string;
}

export default function SubmitBidPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [bidInvitation, setBidInvitation] = useState<BidInvitation | null>(null);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [allContractors, setAllContractors] = useState<Contractor[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [existingBid, setExistingBid] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<{ role: string } | null>(null);
  
  // Form state
  const [bidAmount, setBidAmount] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [technicalProposal, setTechnicalProposal] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [projectId]);

  /**
   * Fetches project, bid invitation, and contractor data
   * @description Parallel database queries for efficiency
   */
  const fetchData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      // Get contractor profile (for actual contractors)
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('*')
        .eq('email', user.email)
        .single();

      setContractor(contractorData);

      // If System Administrator, fetch all contractors for selection
      if (profile?.role === 'System_Administrator') {
        const { data: contractors } = await supabase
          .from('contractors')
          .select('*')
          .order('company_name', { ascending: true });
        
        setAllContractors(contractors || []);
      }

      // Get project details
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      setProject(projectData);

      // Get bid invitation
      const { data: invitation } = await supabase
        .from('bid_invitations')
        .select('*')
        .eq('project_id', projectId)
        .single();

      setBidInvitation(invitation);

      // Check if contractor already submitted a bid
      if (contractorData) {
        const { data: existingBidData } = await supabase
          .from('bids')
          .select('id')
          .eq('project_id', projectId)
          .eq('contractor_id', contractorData.id)
          .single();

        setExistingBid(!!existingBidData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gets the active contractor (either user's own or admin-selected)
   */
  const getActiveContractor = (): Contractor | null => {
    if (userProfile?.role === 'System_Administrator' && selectedContractorId) {
      return allContractors.find(c => c.id === selectedContractorId) || null;
    }
    return contractor;
  };

  /**
   * Validates the bid amount
   * @description O(1) validation checks
   */
  const validateBid = (): boolean => {
    const amount = parseFloat(bidAmount);
    const activeContractor = getActiveContractor();
    
    if (!activeContractor) {
      if (userProfile?.role === 'System_Administrator') {
        setError('Please select a contractor to submit the bid on behalf of');
      } else {
        setError('No contractor profile found. Please contact BAC to register.');
      }
      return false;
    }

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount');
      return false;
    }

    // Check against budget limits
    const maxBudget = project?.approved_budget_amount || project?.estimated_cost || 0;
    if (amount > maxBudget) {
      setError(`Bid amount cannot exceed the approved budget of ₱${maxBudget.toLocaleString()}`);
      return false;
    }

    // Check if deadline has passed
    if (bidInvitation && new Date(bidInvitation.bid_closing_date) < new Date()) {
      setError('The bidding deadline has passed');
      return false;
    }

    if (!technicalProposal.trim()) {
      setError('Please provide a technical proposal');
      return false;
    }

    return true;
  };

  /**
   * Handles bid submission
   * @description Inserts bid into database with O(1) operation
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateBid()) return;
    
    const activeContractor = getActiveContractor();
    if (!activeContractor) {
      setError('No contractor selected');
      return;
    }

    setSubmitting(true);

    try {
      // Insert the bid
      const { error: insertError } = await supabase
        .from('bids')
        .insert({
          project_id: projectId,
          contractor_id: activeContractor.id,
          bid_amount: parseFloat(bidAmount),
          bid_date: new Date().toISOString(),
          is_winning_bid: false
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard/contractor');
      }, 2000);

    } catch (err: any) {
      console.error('Error submitting bid:', err);
      setError(err.message || 'Failed to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Format currency to Philippine Peso
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  /**
   * Format date to readable string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
              Only contractors can submit bids.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Project not found.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (existingBid) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link href="/dashboard/contractor">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          <Card className="border-yellow-500">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Bid Already Submitted</h2>
                <p className="text-muted-foreground">
                  You have already submitted a bid for this project. You can view your bid status in your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout>
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Bid Submitted Successfully!</h2>
              <p className="text-muted-foreground">
                Your bid has been submitted and is pending review by the BAC Secretariat.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard/contractor">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submit Bid Proposal</h1>
          <p className="text-muted-foreground">
            Review the project details and submit your competitive bid
          </p>
        </div>

        {/* No Contractor Warning - Only show for Contractor role users */}
        {userProfile?.role === 'Contractor' && !contractor && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No contractor profile found for your account. Please contact the BAC Secretariat to register your company before submitting bids.
            </AlertDescription>
          </Alert>
        )}

        {/* Project Details Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" /> {project.barangay} • {project.project_category}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Open for Bidding
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Project Description</h4>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            
            {project.problem_description && (
              <div>
                <h4 className="font-medium mb-1">Problem Description</h4>
                <p className="text-sm text-muted-foreground">{project.problem_description}</p>
              </div>
            )}

            {project.proposed_solution && (
              <div>
                <h4 className="font-medium mb-1">Proposed Solution</h4>
                <p className="text-sm text-muted-foreground">{project.proposed_solution}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Approved Budget</p>
                <p className="font-semibold text-lg text-green-600">
                  {formatCurrency(project.approved_budget_amount || project.estimated_cost)}
                </p>
              </div>
              {bidInvitation && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Bid Opening</p>
                    <p className="font-medium">{formatDate(bidInvitation.bid_opening_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bid Closing</p>
                    <p className="font-medium text-red-600">{formatDate(bidInvitation.bid_closing_date)}</p>
                  </div>
                </>
              )}
            </div>

            {bidInvitation?.requirements && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-1">Requirements</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bidInvitation.requirements}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Contractor Selector */}
        {userProfile?.role === 'System_Administrator' && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">Admin Mode: Select Contractor</CardTitle>
                  <CardDescription>As an admin, you can submit bids on behalf of any registered contractor</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contractor-select">Select Contractor *</Label>
                  <Select value={selectedContractorId} onValueChange={setSelectedContractorId}>
                    <SelectTrigger id="contractor-select">
                      <SelectValue placeholder="Choose a contractor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allContractors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name} (TIN: {c.tin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {allContractors.length === 0 && (
                    <p className="text-sm text-muted-foreground">No contractors found. Please add contractors first.</p>
                  )}
                </div>
                
                {/* Show selected contractor details */}
                {selectedContractorId && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t">
                    {(() => {
                      const selected = allContractors.find(c => c.id === selectedContractorId);
                      if (!selected) return null;
                      return (
                        <>
                          <div>
                            <p className="text-muted-foreground">TIN</p>
                            <p className="font-medium">{selected.tin}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Contact Person</p>
                            <p className="font-medium">{selected.contact_person}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{selected.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Phone</p>
                            <p className="font-medium">{selected.phone}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contractor Info (for actual contractors) */}
        {userProfile?.role === 'Contractor' && contractor && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">Bidding as</CardTitle>
                  <CardDescription>{contractor.company_name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">TIN</p>
                  <p className="font-medium">{contractor.tin}</p>
                </div>
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bid Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Bid Proposal</CardTitle>
            <CardDescription>
              Enter your competitive bid amount and proposal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="bidAmount">Bid Amount (PHP) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bidAmount"
                    type="number"
                    placeholder="Enter your bid amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="pl-10"
                    step="0.01"
                    min="1"
                    max={project.approved_budget_amount || project.estimated_cost}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum allowed: {formatCurrency(project.approved_budget_amount || project.estimated_cost)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposedTimeline">Proposed Timeline (days)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="proposedTimeline"
                    type="number"
                    placeholder="Number of days to complete"
                    value={proposedTimeline}
                    onChange={(e) => setProposedTimeline(e.target.value)}
                    className="pl-10"
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technicalProposal">Technical Proposal *</Label>
                <Textarea
                  id="technicalProposal"
                  placeholder="Describe your approach, methodology, equipment, and qualifications for this project..."
                  value={technicalProposal}
                  onChange={(e) => setTechnicalProposal(e.target.value)}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include details about your methodology, timeline, equipment, and relevant experience.
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <Link href="/dashboard/contractor">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={submitting || (userProfile?.role === 'System_Administrator' ? !selectedContractorId : !contractor)}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Submit Bid
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
