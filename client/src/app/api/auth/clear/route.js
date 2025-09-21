import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  
  // Get all cookie names that might be related to NextAuth
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter(cookie => 
    cookie.name.includes('next-auth') || 
    cookie.name.includes('authjs') ||
    cookie.name.includes('session') ||
    cookie.name.includes('csrf')
  );

  // Create response that clears all auth cookies
  const response = new Response(JSON.stringify({ 
    message: 'All authentication cookies cleared',
    clearedCookies: authCookies.map(c => c.name)
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Clear each auth cookie
  authCookies.forEach(cookie => {
    response.headers.append('Set-Cookie', `${cookie.name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`);
  });

  // Also clear common NextAuth cookie names even if they don't exist
  const commonAuthCookies = [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    'authjs.session-token',
    'authjs.csrf-token',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.csrf-token'
  ];

  commonAuthCookies.forEach(cookieName => {
    response.headers.append('Set-Cookie', `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`);
  });

  return response;
}
