'use client';

/**
 * @fileoverview Project Proposal Form Component
 * 
 * This component handles the creation of new project proposals.
 * Uses form state management and database insert operations.
 * 
 * @description DSA Overview:
 * 
 * 1. **State Management**: Using React useState hooks
 *    - Time Complexity: O(1) for each state update
 *    - Space Complexity: O(1) per state variable
 * 
 * 2. **Form Submission**: Database INSERT operation
 *    - Time Complexity: O(1) locally, database-dependent for insert
 *    - Async operation with error handling
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

/**
 * Project Proposal Form Component
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.userId - The ID of the user creating the proposal
 * 
 * @description Creates new project proposals with form validation and database insertion.
 * 
 * **DSA Implementations:**
 * 
 * 1. **State Variables - React useState**
 *    - Data Structure: Individual state atoms
 *    - Time Complexity: O(1) for get/set operations
 *    - Each form field has its own state (title, description, etc.)
 * 
 * 2. **handleSubmit() - Form Submission**
 *    - Algorithm: Validation + Database Insert
 *    - Time Complexity: O(1) locally, network-dependent for API
 *    - Steps:
 *      a. Prevent default form behavior
 *      b. Reset error/success states
 *      c. Validate input (implicit via HTML required)
 *      d. Create project object
 *      e. Insert to database via Supabase
 *      f. Handle success/error response
 * 
 * 3. **parseFloat(estimatedCost) - String to Number**
 *    - Time Complexity: O(n) where n = string length
 *    - Converts user input string to floating point number
 * 
 * **Data Flow:**
 * ```
 * User Input → State Update (O(1))
 *       ↓
 * Form Submit → Validation
 *       ↓
 * Create Object → Database INSERT
 *       ↓
 * Success → Redirect (setTimeout)
 * ```
 * 
 * @returns {JSX.Element} Rendered proposal form
 * 
 * @example
 * // Usage:
 * <ProposalForm userId="user-uuid-123" />
 */
export function ProposalForm({ userId }: { userId: string }) {
  /**
   * Form state variables
   * @description Each uses useState for O(1) updates
   */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [barangay, setBarangay] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  
  /**
   * UI state variables
   */
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  /**
   * Handles form submission
   * 
   * @async
   * @function handleSubmit
   * @param {React.FormEvent} e - Form event
   * 
   * @description DSA: Sequential Operation (No specific algorithm)
   * 
   * Time Complexity: O(1) locally
   * - State updates: O(1) each
   * - Object creation: O(1)
   * - parseFloat: O(n) where n = cost string length (typically ~10 chars)
   * - Network call: Variable (async)
   * 
   * Process:
   * 1. e.preventDefault() - Prevents page reload
   * 2. Reset states - O(1) × 3 operations
   * 3. Create insert object - O(1)
   * 4. Database insert - Network-dependent
   * 5. Handle response - O(1) state updates
   * 6. Redirect on success - setTimeout O(1)
   * 
   * Why async/await:
   * - Database operation is asynchronous
   * - Non-blocking: UI remains responsive during insert
   * - Error handling with try/catch for network failures
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      /**
       * Database INSERT operation
       * @description Inserts new project record
       * - Time Complexity: O(1) locally, database-dependent
       * - Creates single row in projects table
       */
      const { error } = await supabase.from('projects').insert({
        title,
        description,
        barangay,
        project_category: category,
        estimated_cost: parseFloat(estimatedCost), // O(n) string parsing
        problem_description: problemDescription,
        proposed_solution: proposedSolution,
        created_by: userId,
        status: 'Pending_Review',
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        /**
         * Delayed redirect after successful submission
         * @description setTimeout schedules redirect - O(1)
         */
        setTimeout(() => {
          router.push('/dashboard/planner');
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
        <CardTitle>Project Proposal Details</CardTitle>
        <CardDescription>Fill out all required fields to submit your proposal</CardDescription>
      </CardHeader>
      <CardContent>
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
                Proposal submitted successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-foreground">Project Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Flood Control System for Barangay A"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="barangay" className="text-foreground">Barangay</Label>
                  <Input
                    id="barangay"
                    placeholder="Barangay name"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-foreground">Project Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flood_Control">Flood Control</SelectItem>
                      <SelectItem value="Road_Infrastructure">Road Infrastructure</SelectItem>
                      <SelectItem value="Water_Supply">Water Supply</SelectItem>
                      <SelectItem value="Health_Facility">Health Facility</SelectItem>
                      <SelectItem value="Education_Facility">Education Facility</SelectItem>
                      <SelectItem value="Community_Center">Community Center</SelectItem>
                      <SelectItem value="Market">Market</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedCost" className="text-foreground">Estimated Cost (PHP)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  placeholder="0.00"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Project Details</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="problemDescription" className="text-foreground">Problem Description</Label>
                <Textarea
                  id="problemDescription"
                  placeholder="Describe the problem or need that this project addresses..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="proposedSolution" className="text-foreground">Proposed Solution</Label>
                <Textarea
                  id="proposedSolution"
                  placeholder="Describe the proposed solution and expected benefits..."
                  value={proposedSolution}
                  onChange={(e) => setProposedSolution(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-foreground">General Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a comprehensive description of the project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-border">
            <Button
              type="submit"
              disabled={loading || success}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Proposal'}
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
