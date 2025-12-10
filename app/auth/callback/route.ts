import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth Callback Route Handler
 * 
 * @description Handles OAuth and email link callbacks from Supabase Auth
 * This route processes:
 * - Email verification links
 * - Password reset links
 * - OAuth provider callbacks
 * 
 * The code parameter in the URL is exchanged for a session.
 * 
 * @param {Request} request - The incoming request
 * @returns {NextResponse} Redirect to appropriate page
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  
  // Get the authorization code from the URL
  const code = searchParams.get('code');
  
  // Get the 'next' parameter for redirect after auth (default to dashboard)
  const next = searchParams.get('next') ?? '/dashboard';
  
  // Check for type parameter (used by Supabase for different auth flows)
  const type = searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Check if this is a password recovery flow
      // Supabase sets a special flag in the session for recovery
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      
      // Also check the session's aal (authenticator assurance level) or user metadata
      // If user came from email link and needs password reset
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this might be a recovery session by looking at how user got here
      // The session will have specific properties for recovery
      if (session?.user?.recovery_sent_at) {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      
      // Default redirect (email verification, OAuth, etc.)
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Auth callback error:', error.message);
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
