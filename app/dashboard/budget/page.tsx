/**
 * @fileoverview Budget Management Dashboard with statistics and visualizations
 * 
 * This server component displays budget statistics and manages fund allocation.
 * Implements aggregation algorithms for computing totals and groupings.
 * 
 * @description DSA Overview:
 * 
 * 1. **Reduce Algorithm**: For computing totals and groupings
 *    - Time Complexity: O(n) where n = number of projects
 * 
 * 2. **Object.entries()**: For converting grouped data to array
 *    - Time Complexity: O(k) where k = number of unique keys
 * 
 * 3. **Sort Algorithm**: For ranking barangays by budget
 *    - Time Complexity: O(k log k) where k = number of barangays
 * 
 * 4. **Array Slice**: For getting top 5 barangays
 *    - Time Complexity: O(5) = O(1) constant
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetProjectsList } from '@/components/budget/projects-list';
import { DollarSign, TrendingUp, Wallet, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, ProgressChart } from '@/components/ui/charts';

/**
 * Budget Dashboard Page Component
 * 
 * @async
 * @function BudgetDashboard
 * @description Server component that displays budget statistics and project allocation.
 * 
 * **DSA Implementations:**
 * 
 * 1. **totalPrioritized - Array Reduce (Sum)**
 *    - Algorithm: Linear aggregation
 *    - Time Complexity: O(n) where n = prioritized projects
 *    - Code: `projects.reduce((sum, p) => sum + p.estimated_cost, 0)`
 *    - Sums all estimated costs in one pass
 * 
 * 2. **totalFunded - Array Reduce (Sum)**
 *    - Algorithm: Linear aggregation
 *    - Time Complexity: O(n) where n = funded projects
 *    - Sums all approved budget amounts
 * 
 * 3. **totalDisbursed - Array Reduce (Sum)**
 *    - Algorithm: Linear aggregation
 *    - Time Complexity: O(n) where n = funded projects
 *    - Sums all disbursed amounts
 * 
 * 4. **barangayBudgets - Reduce (Grouping)**
 *    - Algorithm: Linear grouping with accumulator
 *    - Time Complexity: O(n) where n = all projects
 *    - Groups budget totals by barangay name
 *    - Uses object as accumulator for O(1) key access
 * 
 * 5. **barangayChartData - Object.entries + Sort + Slice**
 *    - Object.entries(): O(k) where k = unique barangays
 *    - .sort(): O(k log k) TimSort
 *    - .slice(0, 5): O(5) = O(1) constant
 *    - Total: O(k log k)
 * 
 * **Data Flow:**
 * ```
 * Database Query → Array of Projects
 *       ↓
 * reduce() → Total Sums (O(n))
 *       ↓
 * reduce() → Grouped by Barangay (O(n))
 *       ↓
 * Object.entries() → Array of [key, value] (O(k))
 *       ↓
 * sort() → Sorted by value descending (O(k log k))
 *       ↓
 * slice(0, 5) → Top 5 only (O(1))
 * ```
 * 
 * @returns {Promise<JSX.Element>} Rendered budget dashboard
 */
export default async function BudgetDashboard() {
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

  // Get budget statistics
  const { data: prioritizedProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'Prioritized');

  const { data: fundedProjects } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['Funded', 'Open_For_Bidding', 'In_Progress', 'Completed']);

  const { data: allProjects } = await supabase
    .from('projects')
    .select('estimated_cost, approved_budget_amount, amount_disbursed, status, barangay');

  /**
   * Total estimated cost of prioritized projects
   * 
   * @description DSA: Array Reduce (Summation)
   * 
   * Algorithm: Linear aggregation
   * Time Complexity: O(n) where n = prioritized projects
   * Space Complexity: O(1) - single accumulator
   * 
   * How reduce works:
   * 1. Start with initial value 0
   * 2. For each project, add estimated_cost to sum
   * 3. Return final sum after all iterations
   * 
   * Example:
   * [{ cost: 100 }, { cost: 200 }, { cost: 150 }]
   * → 0 + 100 = 100
   * → 100 + 200 = 300
   * → 300 + 150 = 450 (final result)
   */
  const totalPrioritized = prioritizedProjects?.reduce((sum, p) => sum + (p.estimated_cost || 0), 0) || 0;
  
  /**
   * Total approved budget of funded projects
   * @description DSA: Array Reduce - O(n)
   */
  const totalFunded = fundedProjects?.reduce((sum, p) => sum + (p.approved_budget_amount || 0), 0) || 0;
  
  /**
   * Total amount already disbursed
   * @description DSA: Array Reduce - O(n)
   */
  const totalDisbursed = fundedProjects?.reduce((sum, p) => sum + (p.amount_disbursed || 0), 0) || 0;
  
  /**
   * Remaining budget available
   * @description Simple subtraction - O(1)
   */
  const remaining = totalFunded - totalDisbursed;

  /**
   * Budget grouped by barangay
   * 
   * @description DSA: Array Reduce (Grouping with Object Accumulator)
   * 
   * Algorithm: Linear grouping
   * Time Complexity: O(n) where n = all projects
   * Space Complexity: O(k) where k = unique barangays
   * 
   * How it works:
   * 1. Start with empty object {} as accumulator
   * 2. For each project with approved_budget_amount:
   *    a. Get barangay name (or 'Unknown' if null)
   *    b. If key exists: add to existing value
   *    c. If key doesn't exist: initialize with current value
   * 3. Return object with barangay → total mapping
   * 
   * Example:
   * [{ barangay: 'A', amount: 100 }, { barangay: 'B', amount: 200 }, { barangay: 'A', amount: 50 }]
   * → { A: 100 }           // First A
   * → { A: 100, B: 200 }   // First B
   * → { A: 150, B: 200 }   // Second A adds to existing
   * 
   * Why reduce with object:
   * - O(1) key lookup/update per iteration
   * - Single pass through data
   * - Efficient for grouping operations
   */
  const barangayBudgets = allProjects?.reduce((acc: Record<string, number>, project) => {
    if (project.approved_budget_amount) {
      const barangay = project.barangay || 'Unknown';
      acc[barangay] = (acc[barangay] || 0) + project.approved_budget_amount;
    }
    return acc;
  }, {}) || {};

  /**
   * Chart data for top 5 barangays by budget
   * 
   * @description DSA: Object.entries + Sort + Slice Pipeline
   * 
   * Pipeline:
   * 1. Object.entries(barangayBudgets)
   *    - Converts { A: 100, B: 200 } → [['A', 100], ['B', 200]]
   *    - Time: O(k) where k = unique barangays
   * 
   * 2. .map(([label, value]) => ({ label, value, color }))
   *    - Transforms to chart data format
   *    - Time: O(k)
   * 
   * 3. .sort((a, b) => b.value - a.value)
   *    - Sorts descending by value (highest first)
   *    - Algorithm: TimSort
   *    - Time: O(k log k)
   * 
   * 4. .slice(0, 5)
   *    - Takes first 5 elements
   *    - Time: O(5) = O(1) constant
   * 
   * Total Time Complexity: O(k) + O(k) + O(k log k) + O(1) = O(k log k)
   * where k = number of unique barangays
   */
  const barangayChartData = Object.entries(barangayBudgets)
    .map(([label, value]) => ({
      label,
      value: value as number,
      color: 'bg-blue-500',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 barangays

  /**
   * Budget utilization percentage
   * 
   * @description Simple arithmetic - O(1)
   * Formula: (disbursed / funded) × 100
   */
  const utilizationRate = totalFunded > 0 ? (totalDisbursed / totalFunded) * 100 : 0;

  return (
    <DashboardLayout userRole={userProfile?.role} userEmail={user.email}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budget Management Dashboard</h2>
          <p className="text-muted-foreground mt-2">Allocate budgets and track disbursements for prioritized projects</p>
        </div>

        {/* Budget Stats - Gradient Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prioritized Total</CardTitle>
              <DollarSign className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₱{(totalPrioritized / 1000000).toFixed(2)}M</div>
              <p className="text-xs opacity-80 mt-1">{prioritizedProjects?.length || 0} projects awaiting budget</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <DollarSign className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funded Total</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₱{(totalFunded / 1000000).toFixed(2)}M</div>
              <p className="text-xs opacity-80 mt-1">{fundedProjects?.length || 0} projects funded</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <TrendingUp className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disbursed</CardTitle>
              <Activity className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₱{(totalDisbursed / 1000000).toFixed(2)}M</div>
              <p className="text-xs opacity-80 mt-1">{utilizationRate.toFixed(1)}% utilization</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Activity className="h-24 w-24" />
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Wallet className="h-4 w-4 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₱{(remaining / 1000000).toFixed(2)}M</div>
              <p className="text-xs opacity-80 mt-1">Available for disbursement</p>
            </CardContent>
            <div className="absolute bottom-0 right-0 opacity-10">
              <Wallet className="h-24 w-24" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {barangayChartData.length > 0 && (
            <BarChart
              title="Budget Allocation by Barangay (Top 5)"
              description="Total approved budgets per barangay"
              data={barangayChartData.map(item => ({
                ...item,
                value: item.value / 1000000, // Convert to millions
              }))}
            />
          )}

          {totalFunded > 0 && (
            <ProgressChart
              title="Budget Utilization"
              description="Disbursed vs Total Allocated"
              current={totalDisbursed}
              total={totalFunded}
              color="bg-purple-500"
              formatAsCurrency={true}
            />
          )}
        </div>

        {/* Prioritized Projects for Budget Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Prioritized Projects Awaiting Budget</CardTitle>
            <CardDescription>Allocate budgets to these projects</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetProjectsList status="Prioritized" />
          </CardContent>
        </Card>

        {/* Already Funded Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Funded Projects</CardTitle>
            <CardDescription>Projects with allocated budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetProjectsList status="Funded" showBudgetInfo />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
