'use client';

/**
 * @fileoverview Budget Allocation Form Component
 * 
 * This component handles budget allocation for prioritized projects.
 * Implements database UPDATE and INSERT operations for project funding.
 * 
 * @description DSA Overview:
 * 
 * 1. **State Management**: React useState hooks
 *    - Time Complexity: O(1) for each state update
 * 
 * 2. **Database Operations**: UPDATE project + INSERT history
 *    - Two sequential database operations
 *    - Time Complexity: O(1) locally, database-dependent
 * 
 * 3. **Input Validation**: Simple conditionals
 *    - Time Complexity: O(1)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

/**
 * Project interface for type safety
 * 
 * @interface Project
 * @description Data structure representing a project for budget allocation
 */
interface Project {
  id: string;
  title: string;
  barangay: string;
  estimated_cost: number;
  approved_budget_amount?: number;
  fund_source_code?: string;
  status: string;
}

/**
 * Budget Allocation Form Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Project} props.project - The project to allocate budget for
 * @param {string} props.userId - The ID of the user performing the allocation
 * 
 * @description Handles budget allocation with validation and history logging.
 * 
 * **DSA Implementations:**
 * 
 * 1. **State Variables - React useState**
 *    - Data Structure: Individual state atoms
 *    - Time Complexity: O(1) for get/set operations
 *    - States: approvedBudget, fundSourceCode, error, success, loading
 * 
 * 2. **handleSubmit() - Form Submission with Validation**
 *    - Algorithm: Sequential validation + database operations
 *    - Time Complexity: O(1) locally, network-dependent for API
 *    - Steps:
 *      a. Validate fund source code (string trim check)
 *      b. Validate budget amount (> 0)
 *      c. UPDATE project record
 *      d. INSERT history record (audit trail)
 *      e. Handle response
 * 
 * 3. **Input Validation - Conditional Checks**
 *    - Time Complexity: O(1) each
 *    - Checks: empty string, number > 0
 * 
 * **Data Flow:**
 * ```
 * User Input → State Update (O(1))
 *       ↓
 * Form Submit → Validation (O(1))
 *       ↓
 * UPDATE projects (set budget, status)
 *       ↓
 * INSERT project_history (audit log)
 *       ↓
 * Success → Redirect
 * ```
 * 
 * **Database Operations:**
 * 1. UPDATE projects SET approved_budget_amount, fund_source_code, status WHERE id
 * 2. INSERT INTO project_history (audit record)
 * 
 * @returns {JSX.Element} Rendered budget allocation form
 * 
 * @example
 * // Usage:
 * <BudgetAllocationForm 
 *   project={projectData} 
 *   userId="user-uuid-123" 
 * />
 */
export function BudgetAllocationForm({ project, userId }: { project: Project; userId: string }) {
  /**
   * Approved budget amount state
   * @description Initialized with existing budget or estimated cost
   * Uses toString() for input binding - O(1)
   */
  const [approvedBudget, setApprovedBudget] = useState(project.approved_budget_amount?.toString() || project.estimated_cost.toString());
  
  /**
   * Fund source code state
   * @description Unique identifier for budget allocation
   */
  const [fundSourceCode, setFundSourceCode] = useState(project.fund_source_code || '');
  
  /**
   * UI state variables
   */
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  /**
   * Handles budget allocation form submission
   * 
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Form event
   * 
   * @description DSA: Sequential Validation + Database Operations
   * 
   * Time Complexity:
   * - Validation: O(1) string checks
   * - parseFloat: O(n) where n = string length (~10 chars)
   * - Database UPDATE: Network-dependent
   * - Database INSERT: Network-dependent
   * 
   * Process Flow:
   * 1. **Validation Phase** (O(1)):
   *    - Check fundSourceCode is not empty (trim + boolean)
   *    - Check budgetAmount > 0
   * 
   * 2. **Database UPDATE** (network):
   *    - Updates: approved_budget_amount, fund_source_code, status
   *    - Filter: WHERE id = project.id
   * 
   * 3. **History INSERT** (network):
   *    - Logs: project_id, changed_by, action_type, old_status, new_status
   *    - change_details: JSON object with budget info
   * 
   * Why two operations:
   * - UPDATE: Changes project state
   * - INSERT: Creates audit trail for accountability
   * - Both needed for proper financial tracking
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      /**
       * Validation: Fund source code required
       * @description O(1) string check using trim()
       */
      if (!fundSourceCode.trim()) {
        setError('Fund source code is required');
        setLoading(false);
        return;
      }

      /**
       * Parse and validate budget amount
       * @description parseFloat: O(n) where n = string length
       * Validation: Simple comparison O(1)
       */
      const budgetAmount = parseFloat(approvedBudget);
      if (budgetAmount <= 0) {
        setError('Budget amount must be greater than 0');
        setLoading(false);
        return;
      }

      /**
       * Database UPDATE operation
       * @description Updates project with budget allocation
       * - Sets approved_budget_amount, fund_source_code, status
       * - Time Complexity: O(1) locally, database O(log n) for index lookup
       */
      const { error } = await supabase
        .from('projects')
        .update({
          approved_budget_amount: budgetAmount,
          fund_source_code: fundSourceCode,
          status: 'Funded',
        })
        .eq('id', project.id);

      if (error) {
        setError(error.message);
      } else {
        /**
         * Database INSERT for audit history
         * @description Creates audit trail record
         * - Logs who made the change, when, and what changed
         * - Time Complexity: O(1) insert operation
         */
        await supabase.from('project_history').insert({
          project_id: project.id,
          changed_by: userId,
          action_type: 'Budget_Allocated',
          old_status: project.status,
          new_status: 'Funded',
          change_details: {
            approved_budget_amount: budgetAmount,
            fund_source_code: fundSourceCode,
          },
        });

        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/budget');
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>{project.barangay}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-foreground">Estimated Cost</Label>
            <p className="text-lg font-semibold text-primary mt-2">
              PHP {project.estimated_cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <Label className="text-foreground">Current Status</Label>
            <div className="mt-2">
              <Badge className="bg-blue-100 text-blue-800">{project.status.replace(/_/g, ' ')}</Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Budget allocated successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="budget" className="text-foreground">Approved Budget Amount (PHP)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="0.00"
              value={approvedBudget}
              onChange={(e) => setApprovedBudget(e.target.value)}
              step="0.01"
              min="0"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: PHP {project.estimated_cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <Label htmlFor="fundSource" className="text-foreground">Fund Source Code</Label>
            <Input
              id="fundSource"
              type="text"
              placeholder="e.g., 2024-01-FLOOD-CONTROL"
              value={fundSourceCode}
              onChange={(e) => setFundSourceCode(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              Unique identifier for the budget source allocation
            </p>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border">
            <Button
              type="submit"
              disabled={loading || success}
              className="flex-1"
            >
              {loading ? 'Allocating...' : 'Allocate Budget & Fund Project'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
