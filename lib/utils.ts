/**
 * @fileoverview Utility functions for the application
 * 
 * Contains helper functions used throughout the codebase.
 * 
 * @description DSA Overview:
 * 
 * 1. **cn() - Class Name Merger**
 *    - Uses clsx for conditional classes
 *    - Uses twMerge to resolve Tailwind conflicts
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names with Tailwind CSS conflict resolution
 * 
 * @function cn
 * @param {...ClassValue[]} inputs - Class values to merge (strings, objects, arrays)
 * @returns {string} Merged and deduplicated class string
 * 
 * @description DSA: String concatenation with conflict resolution
 * 
 * **How it works:**
 * 
 * 1. **clsx() - Conditional Class Building**
 *    - Time Complexity: O(n) where n = number of inputs
 *    - Handles: strings, objects { 'class': boolean }, arrays
 *    - Filters out falsy values
 * 
 * 2. **twMerge() - Tailwind Conflict Resolution**
 *    - Time Complexity: O(n) where n = number of classes
 *    - Resolves conflicts like "p-4 p-6" → "p-6" (last wins)
 *    - Handles Tailwind-specific patterns
 * 
 * **Why this function:**
 * - Safely combine conditional classes
 * - Prevent duplicate/conflicting Tailwind classes
 * - Standard pattern in modern React/Next.js apps
 * 
 * @example
 * // Basic usage:
 * cn('px-4', 'py-2') // → "px-4 py-2"
 * 
 * // Conditional classes:
 * cn('btn', isActive && 'btn-active') // → "btn btn-active" or "btn"
 * 
 * // Object syntax:
 * cn('text-sm', { 'text-red-500': hasError }) // → "text-sm text-red-500" or "text-sm"
 * 
 * // Conflict resolution:
 * cn('p-4', 'p-8') // → "p-8" (twMerge resolves conflict)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
