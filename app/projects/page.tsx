'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, User, Search, TrendingUp, FolderOpen, CheckCircle2, Clock } from 'lucide-react';
import { useDebouncedValue } from '@/lib/hooks/use-debounce';

interface Project {
  id: string;
  title: string;
  description: string;
  barangay: string;
  project_category: string;
  estimated_cost: number;
  approved_budget_amount?: number;
  status: string;
  contractors?: {
    company_name: string;
  } | null;
}

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userRole, setUserRole] = useState<string>();
  const [userEmail, setUserEmail] = useState<string>();
  const supabase = createClient();

  // OPTIMIZATION: Debounce search to reduce filtering operations (only filters after 300ms of no typing)
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // OPTIMIZATION: Memoized statistics - only recalculate when projects change
  const statistics = useMemo(() => {
    const totalProjects = projects.length;
    const inProgressCount = projects.filter(p => p.status === 'In_Progress').length;
    const completedCount = projects.filter(p => p.status === 'Completed').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.approved_budget_amount || p.estimated_cost || 0), 0);
    
    return { totalProjects, inProgressCount, completedCount, totalBudget };
  }, [projects]);

  // OPTIMIZATION: Memoized filtered projects - single-pass filter instead of 3 separate filters (3x faster)
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter - check title, barangay, and description
      const matchesSearch = !debouncedSearchTerm || 
        project.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        project.barangay.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'all' || 
        project.project_category === categoryFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        project.status === statusFilter;

      // Return true only if ALL conditions match (AND operation)
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projects, debouncedSearchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          setUserRole(profile?.role);
        }

        // Fetch projects
        const { data, error } = await supabase
          .from('projects')
          .select(`
            id,
            title,
            description,
            barangay,
            project_category,
            estimated_cost,
            approved_budget_amount,
            status,
            contractors!contractor_id (
              company_name
            )
          `)
          .in('status', ['In_Progress', 'Completed', 'Open_For_Bidding'])
          .order('created_at', { ascending: false })
          .returns<Project[]>();

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In_Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Open_For_Bidding':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = [
    'Flood_Control',
    'Road_Infrastructure',
    'Water_Supply',
    'Health_Facility',
    'Education_Facility',
    'Community_Center',
    'Market',
  ];

  return (
    <DashboardLayout userRole={userRole} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Public Projects</h1>
          <p className="text-muted-foreground">Browse ongoing and completed infrastructure projects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
            <div className="absolute top-4 right-4 opacity-10">
              <FolderOpen className="h-16 w-16" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {statistics.totalProjects}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All statuses</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
            <div className="absolute top-4 right-4 opacity-10">
              <Clock className="h-16 w-16" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-purple-800 bg-clip-text text-transparent">
                {statistics.inProgressCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active projects</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-green-500">
            <div className="absolute top-4 right-4 opacity-10">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-green-800 bg-clip-text text-transparent">
                {statistics.completedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Finished projects</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
            <div className="absolute top-4 right-4 opacity-10">
              <DollarSign className="h-16 w-16" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-amber-800 bg-clip-text text-transparent">
                ₱{(statistics.totalBudget / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground mt-1">Allocated funds</p>
            </CardContent>
          </Card>
        </div>

        {/* Hero Section */}


      {/* Filters */}
      <div className="flex gap-4 flex-col md:flex-row mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects, barangay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="In_Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Open_For_Bidding">Open for Bidding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No projects found matching your filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <MapPin className="w-4 h-4" />
                      {project.barangay}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="text-foreground font-semibold">
                          PHP {(project.approved_budget_amount || project.estimated_cost).toLocaleString('en-PH')}
                        </span>
                      </div>

                      {project.contractors && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">{project.contractors.company_name}</span>
                        </div>
                      )}
                    </div>

                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}


      </div>
    </DashboardLayout>
  );
}
