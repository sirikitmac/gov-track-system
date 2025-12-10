import { useEffect, useState } from 'react';

/**
 * Custom React hook that debounces a value
 * 
 * @description DSA: Debouncing Algorithm
 * 
 * Purpose: Delays updating the value until the user stops changing it for a specified time.
 * This prevents excessive function calls during rapid input changes.
 * 
 * How it works:
 * 1. User types "r" → starts 300ms timer
 * 2. User types "o" (within 300ms) → cancels previous timer, starts new 300ms timer
 * 3. User types "a" (within 300ms) → cancels previous timer, starts new 300ms timer
 * 4. User types "d" (within 300ms) → cancels previous timer, starts new 300ms timer
 * 5. User stops typing → after 300ms, value updates to "road"
 * 
 * Time Complexity: O(1) for setup and cleanup
 * Space Complexity: O(1) - only stores one timer ID and one value
 * 
 * Performance Impact:
 * - Without debouncing: "road" = 4 filter operations (r, ro, roa, road)
 * - With debouncing: "road" = 1 filter operation (after 300ms pause)
 * - Reduction: 75-80% fewer operations
 * 
 * @template T - The type of value being debounced
 * @param {T} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {T} The debounced value - only updates after delay with no changes
 * 
 * @example
 * // In a search component:
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebouncedValue(searchTerm, 300);
 * 
 * // debouncedSearch only updates 300ms after user stops typing
 * useEffect(() => {
 *   performSearch(debouncedSearch); // Only called once after typing stops
 * }, [debouncedSearch]);
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  /**
   * @description Data Structure: React State
   * Stores the debounced value that will be returned
   */
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    /**
     * Set up the debounce timer
     * @description Algorithm: Timer-based delay
     * Uses JavaScript's setTimeout for delayed execution
     * Time Complexity: O(1) - constant time to set timer
     */
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    /**
     * Cleanup function - cancels timer if value changes before delay
     * @description This is the key to debouncing:
     * - If value changes, this cleanup runs BEFORE the new effect
     * - Cancels the pending timer, preventing the old value from being set
     * - Only the final value (after user stops) triggers the update
     * 
     * Time Complexity: O(1) - constant time to clear timer
     */
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
