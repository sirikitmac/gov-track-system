"use client";

/**
 * @fileoverview Top navigation bar component with notifications and theme toggle
 * 
 * This component handles the top navigation including notifications dropdown,
 * theme switching, and account menu.
 * 
 * @description DSA Overview:
 * 
 * 1. **Array Filter**: Counting unread notifications
 *    - Time Complexity: O(n) where n = number of notifications
 *    - Space Complexity: O(k) where k = unread count (for filter result)
 * 
 * 2. **Array Map**: Transforming notification states
 *    - Time Complexity: O(n) where n = number of notifications
 *    - Space Complexity: O(n) for new array
 * 
 * 3. **Array Iteration**: Rendering notification list
 *    - Time Complexity: O(n) where n = notifications
 */

import { Bell, Moon, Sun, User, LogOut, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Top navigation bar component
 * 
 * @component
 * @description Displays system header with notifications, theme toggle, and account menu.
 * 
 * **DSA Implementations:**
 * 
 * 1. **unreadCount - Array Filter**
 *    - Algorithm: Linear search with filter
 *    - Time Complexity: O(n) where n = total notifications
 *    - Code: `notifications.filter(n => n.unread).length`
 *    - How it works:
 *      - Iterates through all notifications
 *      - Returns count of items where unread === true
 * 
 * 2. **markAllAsRead() - Array Map**
 *    - Algorithm: Linear transformation
 *    - Time Complexity: O(n) where n = total notifications
 *    - Space Complexity: O(n) for new array (immutable update)
 *    - Code: `notifications.map(n => ({ ...n, unread: false }))`
 *    - How it works:
 *      - Creates new array with all notifications marked as read
 *      - Uses spread operator for immutability (React best practice)
 * 
 * 3. **Notification Rendering - Array Iteration**
 *    - Algorithm: Linear iteration with map
 *    - Time Complexity: O(n) for rendering
 *    - Renders each notification as a list item
 * 
 * @returns {JSX.Element | null} Rendered navbar or null if not mounted
 * 
 * @example
 * // Usage in layout:
 * <TopNavbar />
 */
export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  /**
   * Notifications state array
   * 
   * @description Data Structure: Array of notification objects
   * - Each object has: id, title, time, unread (boolean)
   * - Array allows O(n) iteration for filtering/mapping
   * - Object properties allow O(1) access to individual fields
   */
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New project proposal submitted", time: "5 min ago", unread: true },
    { id: 2, title: "Budget allocation approved", time: "1 hour ago", unread: true },
    { id: 3, title: "Milestone completed", time: "2 hours ago", unread: false },
    { id: 4, title: "New bid submission", time: "3 hours ago", unread: false },
  ]);

  /**
   * Count of unread notifications
   * 
   * @description DSA: Array Filter (Linear Search)
   * 
   * Algorithm: Filter then count
   * Time Complexity: O(n) where n = total notifications
   * Space Complexity: O(k) where k = number of unread items
   * 
   * How it works:
   * 1. filter() iterates through all notifications - O(n)
   * 2. For each item, checks if n.unread === true - O(1)
   * 3. Returns new array of matching items
   * 4. .length returns count - O(1)
   * 
   * Total: O(n) + O(1) = O(n)
   * 
   * Alternative considered:
   * - Manual loop with counter: Same O(n) but less readable
   * - Reduce: Same O(n), more complex for simple counting
   * 
   * @type {number}
   */
  const unreadCount = notifications.filter(n => n.unread).length;

  /**
   * Effect hook for hydration safety
   * 
   * @description Ensures component only renders on client
   * DSA: None (lifecycle management)
   * Time Complexity: O(1)
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Marks all notifications as read
   * 
   * @function markAllAsRead
   * @description Transforms all notification objects to set unread = false
   * 
   * DSA: Array Map (Linear Transformation)
   * Time Complexity: O(n) where n = number of notifications
   * Space Complexity: O(n) - creates new array (immutable update)
   * 
   * How it works:
   * 1. map() iterates through all notifications - O(n)
   * 2. For each notification, creates new object with spread - O(1)
   * 3. Overwrites unread property with false - O(1)
   * 4. Returns new array with all items transformed
   * 
   * Why immutable update:
   * - React requires new reference to detect state changes
   * - Spread operator ({ ...n, unread: false }) creates shallow copy
   * - Triggers re-render with updated state
   * 
   * @returns {void}
   */
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - System name */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">BT</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BuildTrack-LGU
            </h1>
            <p className="text-xs text-muted-foreground">Project Tracking System</p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative h-10 w-10 rounded-lg border bg-background/50 hover:bg-accent transition-all duration-200 flex items-center justify-center group"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-500 group-hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Moon className="h-5 w-5 text-blue-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowAccountMenu(false);
              }}
              className="relative h-10 w-10 rounded-lg border bg-background/50 hover:bg-accent transition-all duration-200 flex items-center justify-center group"
              title="Notifications"
            >
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-top-5 duration-200">
                <div className="p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-accent/50 transition-colors cursor-pointer ${
                          notification.unread ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  href="/dashboard/notifications"
                  className="block p-3 text-center text-sm text-blue-600 hover:bg-accent border-t font-medium"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>

          {/* Account Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAccountMenu(!showAccountMenu);
                setShowNotifications(false);
              }}
              className="relative h-10 px-3 rounded-lg border bg-background/50 hover:bg-accent transition-all duration-200 flex items-center gap-2 group"
              title="Account"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium hidden md:inline">Admin</span>
            </button>

            {/* Account Dropdown */}
            {showAccountMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-top-5 duration-200">
                <div className="p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <p className="font-semibold text-sm">System Administrator</p>
                  <p className="text-xs text-muted-foreground">admin@buildtrack.gov</p>
                </div>
                <div className="p-2">
                  <Link
                    href="/dashboard/admin/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                    onClick={() => setShowAccountMenu(false)}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Settings</span>
                  </Link>
                  <Link
                    href="/auth/logout"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors"
                    onClick={() => setShowAccountMenu(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Logout</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
