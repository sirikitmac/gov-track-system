'use client';

/**
 * @fileoverview Proposal Review Form for Local Development Council
 * 
 * This component allows LDC members to review and approve/reject project proposals.
 * Implements form state management and database operations.
 * 
 * @description DSA Overview:
 * 
 * 1. **State Management**: React useState hooks
 *    - Time Complexity: O(1) for each state update
 * 
 * 2. **Database Operations**: UPDATE + INSERT (audit log)
 *    - Time Complexity: O(1) locally, database-dependent
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

/**
 * Project interface for type safety
 * 
 * @interface Project
 * @description Represents a project proposal for review
 */
interface Project {
  id: string;
  title: string;
  description: string;
  barangay: string;
  problem_description: string;
  proposed_solution: string;
  estimated_cost: number;
  status: string;
}

/**
 * Proposal Review Form Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Project} props.project - The project to review
 * @param {string} props.userId - The ID of the reviewer
 * 
 * @description Allows LDC members to approve or reject project proposals.
 * 
 * **DSA Implementations:**
 * 
 * 1. **State Variables - React useState**
 *    - Data Structure: Individual state atoms
 *    - Time Complexity: O(1) for get/set operations
 *    - States: decision, comments, error, success, loading
 * 
 * 2. **handleDecision() - Review Action Handler**
 *    - Algorithm: Conditional logic + database operations
 *    - Time Complexity: O(1) locally, network-dependent for API
 *    - Steps:
 *      a. Determine new status based on approve boolean
 *      b. UPDATE project status
 *      c. INSERT audit history record
 *      d. Redirect on success
 * 
 * 3. **Ternary Status Selection**
 *    - Time Complexity: O(1) - simple conditional
 *    - Code: `approve ? 'Prioritized' : 'Cancelled'`
 * 
 * **Data Flow:**
 * ```
 * User Decision (approve/reject)
 *       ↓
 * handleDecision(boolean)
 *       ↓
 * Determine new status (O(1) ternary)
 *       ↓
 * UPDATE projects SET status
 *       ↓
 * INSERT project_history (audit)
 *       ↓
 * Success → Redirect
 * ```
 * 
 * @returns {JSX.Element} Rendered review form
 * 
 * @example
 * <ProposalReviewForm 
 *   project={projectData} 
 *   userId="user-uuid-123" 
 * />
 */
export function ProposalReviewForm({ project, userId }: { project: Project; userId: string }) {
  /**
   * Decision state - stores user's choice
   * @type {'approve' | 'reject' | null}
   */
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  
  /**
   * Comments state for optional review notes
   */
  const [comments, setComments] = useState('');
  
  /**
   * UI state variables
   */
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  /**
   * Handles the review decision (approve or reject)
   * 
   * @async
   * @function handleDecision
   * @param {boolean} approve - True for approve, false for reject
   * 
   * @description DSA: Conditional Status + Database Operations
   * 
   * Time Complexity:
   * - Status determination: O(1) ternary operator
   * - Database UPDATE: Network-dependent
   * - Database INSERT: Network-dependent
   * 
   * Process:
   * 1. **Status Determination** (O(1)):
   *    - Ternary: approve ? 'Prioritized' : 'Cancelled'
   *    - Simple conditional with constant time
   * 
   * 2. **Database UPDATE**:
   *    - Updates project status
   *    - Filter: WHERE id = project.id
   * 
   * 3. **Audit History INSERT**:
   *    - Logs: project_id, changed_by, action_type
   *    - Records: old_status → new_status transition
   *    - Includes: comments in change_details JSON
   * 
   * Why audit logging:
   * - Accountability for decisions
   * - Tracks who approved/rejected and when
   * - Required for government transparency
   */
  async function handleDecision(approve: boolean) {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      /**
       * Determine new status based on decision
       * @description DSA: Ternary conditional - O(1)
       */
      const newStatus = approve ? 'Prioritized' : 'Cancelled';

      /**
       * Database UPDATE operation
       * @description Updates project status
       * Time Complexity: O(1) locally, database O(log n) for index
       */
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', project.id);

      if (error) {
        setError(error.message);
      } else {
        /**
         * Database INSERT for audit history
         * @description Creates audit trail record for the decision
         * Time Complexity: O(1) insert operation
         */
        await supabase.from('project_history').insert({
          project_id: project.id,
          changed_by: userId,
          action_type: approve ? 'Prioritized' : 'Rejected',
          old_status: project.status,
          new_status: newStatus,
          change_details: { comments },
        });

        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/ldc');
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Project Details */}
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
              <Label className="text-foreground">Status</Label>
              <div className="mt-2">
                <Badge className="bg-yellow-100 text-yellow-800">{project.status.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-foreground">Problem Description</Label>
            <p className="text-muted-foreground mt-2 p-3 bg-muted rounded border border-border">
              {project.problem_description}
            </p>
          </div>

          <div>
            <Label className="text-foreground">Proposed Solution</Label>
            <p className="text-muted-foreground mt-2 p-3 bg-muted rounded border border-border">
              {project.proposed_solution}
            </p>
          </div>

          <div>
            <Label className="text-foreground">Project Description</Label>
            <p className="text-muted-foreground mt-2 p-3 bg-muted rounded border border-border">
              {project.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Decision</CardTitle>
          <CardDescription>Approve to add to AIP, or reject if not suitable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                Decision saved successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="comments" className="text-foreground">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments or notes about your decision..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-border">
            <Button
              onClick={() => handleDecision(true)}
              disabled={loading || success}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : 'Approve for AIP'}
            </Button>
            <Button
              onClick={() => handleDecision(false)}
              variant="destructive"
              disabled={loading || success}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Reject'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
