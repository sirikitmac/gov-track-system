"use client";

/**
 * @fileoverview Notifications page component with filtering and state management
 * 
 * This page displays user notifications with filter, mark-as-read, and delete functionality.
 * Implements several array manipulation algorithms.
 * 
 * @description DSA Overview:
 * 
 * 1. **Array Filter**: For filtering notifications and counting
 *    - Time Complexity: O(n) where n = notifications
 * 
 * 2. **Array Map**: For transforming notification states
 *    - Time Complexity: O(n) where n = notifications
 * 
 * 3. **Hash Map**: For category color lookup
 *    - Time Complexity: O(1) constant time lookup
 */

import { Bell, CheckCheck, Trash2, Filter } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard-layout";

/**
 * Notifications Page Component
 * 
 * @component
 * @description Displays and manages user notifications with filtering capabilities.
 * 
 * **DSA Implementations:**
 * 
 * 1. **filteredNotifications - Conditional Filter**
 *    - Algorithm: Linear search with filter
 *    - Time Complexity: O(n) where n = total notifications
 *    - Filters by read/unread status based on user selection
 * 
 * 2. **unreadCount - Array Filter**
 *    - Algorithm: Linear search counting
 *    - Time Complexity: O(n)
 *    - Counts notifications where unread === true
 * 
 * 3. **markAsRead() - Array Map with Conditional Update**
 *    - Algorithm: Linear transformation
 *    - Time Complexity: O(n)
 *    - Updates single notification's unread status
 * 
 * 4. **markAllAsRead() - Array Map**
 *    - Algorithm: Linear transformation
 *    - Time Complexity: O(n)
 *    - Sets all notifications to read
 * 
 * 5. **deleteNotification() - Array Filter**
 *    - Algorithm: Linear search removal
 *    - Time Complexity: O(n)
 *    - Removes notification by ID
 * 
 * 6. **getCategoryColor() - Hash Map Lookup**
 *    - Algorithm: Direct key access
 *    - Time Complexity: O(1)
 *    - Returns color class based on category
 * 
 * @returns {JSX.Element} Rendered notifications page
 */
export default function NotificationsPage() {
  /**
   * Filter state for notification display
   * @type {"all" | "unread"}
   */
  const [filter, setFilter] = useState<"all" | "unread">("all");
  
  /**
   * Notifications state array
   * 
   * @description Data Structure: Array of notification objects
   * - Each notification: { id, title, description, time, unread, category }
   * - Array enables O(n) iteration for filter/map operations
   * - Object properties enable O(1) field access
   */
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New project proposal submitted",
      description: "Construction of Barangay Road - Barangay 1 has been submitted for review",
      time: "5 minutes ago",
      unread: true,
      category: "Proposal",
    },
    {
      id: 2,
      title: "Budget allocation approved",
      description: "₱5,000,000 has been allocated for Infrastructure projects",
      time: "1 hour ago",
      unread: true,
      category: "Budget",
    },
    {
      id: 3,
      title: "Milestone completed",
      description: "Foundation Work milestone completed for Project #42",
      time: "2 hours ago",
      unread: false,
      category: "Progress",
    },
    {
      id: 4,
      title: "New bid submission",
      description: "Alpha Construction Corp. submitted a bid for ₱4,800,000",
      time: "3 hours ago",
      unread: false,
      category: "Bidding",
    },
    {
      id: 5,
      title: "Project status changed",
      description: "Water System Improvement moved to In Progress status",
      time: "5 hours ago",
      unread: false,
      category: "Status",
    },
    {
      id: 6,
      title: "Inspection report submitted",
      description: "Technical Inspector submitted report for Project #38",
      time: "1 day ago",
      unread: false,
      category: "Inspection",
    },
  ]);

  /**
   * Filtered notifications based on current filter state
   * 
   * @description DSA: Conditional Array Filter
   * 
   * Algorithm: Linear search with predicate
   * Time Complexity: O(n) where n = total notifications
   * Space Complexity: O(k) where k = matching notifications
   * 
   * How it works:
   * - If filter === "unread": filters to only unread notifications
   * - If filter === "all": returns all notifications (no filter)
   * 
   * @type {Array<Notification>}
   */
  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => n.unread)
    : notifications;

  /**
   * Count of unread notifications
   * 
   * @description DSA: Array Filter with Count
   * 
   * Algorithm: Linear search
   * Time Complexity: O(n) where n = total notifications
   * Space Complexity: O(k) for filter result, then O(1) for length
   * 
   * @type {number}
   */
  const unreadCount = notifications.filter(n => n.unread).length;

  /**
   * Marks a single notification as read
   * 
   * @function markAsRead
   * @param {number} id - The notification ID to mark as read
   * 
   * @description DSA: Array Map with Conditional Update
   * 
   * Algorithm: Linear search and transform
   * Time Complexity: O(n) where n = total notifications
   * Space Complexity: O(n) for new array (immutable update)
   * 
   * How it works:
   * 1. map() iterates through all notifications - O(n)
   * 2. For each notification, checks if id matches - O(1)
   * 3. If match: creates new object with unread = false
   * 4. If no match: returns original object (no change)
   * 
   * Why O(n) not O(1):
   * - Could use Map/Object for O(1) lookup by ID
   * - But array is simpler for small datasets (<100 items)
   * - Immutable update pattern required for React
   */
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, unread: false } : n
    ));
  };

  /**
   * Marks all notifications as read
   * 
   * @function markAllAsRead
   * 
   * @description DSA: Array Map (Full Transform)
   * 
   * Algorithm: Linear transformation
   * Time Complexity: O(n) where n = total notifications
   * Space Complexity: O(n) for new array
   * 
   * How it works:
   * 1. map() iterates through all notifications - O(n)
   * 2. Creates new object for each with unread = false
   * 3. Returns new array with all items transformed
   */
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  /**
   * Deletes a notification by ID
   * 
   * @function deleteNotification
   * @param {number} id - The notification ID to delete
   * 
   * @description DSA: Array Filter (Removal)
   * 
   * Algorithm: Linear search with exclusion
   * Time Complexity: O(n) where n = total notifications
   * Space Complexity: O(n-1) for new array
   * 
   * How it works:
   * 1. filter() iterates through all notifications - O(n)
   * 2. Includes only items where id !== target id
   * 3. Returns new array excluding the deleted item
   * 
   * Alternative considered:
   * - findIndex + splice: O(n) + O(n) = O(n), mutates array
   * - filter: O(n), immutable, preferred for React
   */
  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  /**
   * Gets CSS color classes for notification category
   * 
   * @function getCategoryColor
   * @param {string} category - The notification category
   * @returns {string} CSS class string for the category badge
   * 
   * @description DSA: Hash Map Lookup
   * 
   * Algorithm: Direct key access
   * Time Complexity: O(1) - constant time lookup
   * Space Complexity: O(1) - fixed color mapping
   * 
   * How it works:
   * 1. colors object acts as Hash Map
   * 2. category string is the key
   * 3. Direct access: colors[category] - O(1)
   * 4. Falls back to gray if category not found
   * 
   * Why Hash Map:
   * - O(1) vs O(n) if using if-else or switch
   * - Clean, maintainable code
   * - Easy to add new categories
   */
  const getCategoryColor = (category: string) => {
    /**
     * Category to color mapping
     * @description Hash Map for O(1) color lookup
     */
    const colors: Record<string, string> = {
      Proposal: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      Budget: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      Progress: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      Bidding: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
      Status: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
      Inspection: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your project activities
          </p>
        </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notifications.length}</p>
              <p className="text-sm text-muted-foreground">Total Notifications</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Bell className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CheckCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
              <p className="text-sm text-muted-foreground">Read</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-blue-600"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                {filter === "unread" 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-5 transition-all hover:shadow-md ${
                notification.unread ? "border-l-4 border-l-blue-600 bg-blue-50/30 dark:bg-blue-950/10" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {notification.unread && (
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold mb-1">{notification.title}</h3>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getCategoryColor(notification.category)}`}>
                      {notification.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                    <div className="flex items-center gap-2">
                      {notification.unread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-7 text-xs"
                        >
                          <CheckCheck className="h-3 w-3 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
