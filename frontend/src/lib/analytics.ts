'use client';

const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('hairotic_session_id');
  if (!sid) {
    sid = 'hs_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('hairotic_session_id', sid);
  }
  return sid;
};

export const trackEvent = async (name: string, properties?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const sessionId = getSessionId();

  try {
    await fetch(`${API_URL}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        properties: properties ?? {},
        sessionId,
      }),
    });
  } catch (err) {
    console.error('Failed to log analytics event:', err);
  }
};
