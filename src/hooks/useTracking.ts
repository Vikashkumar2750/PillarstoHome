import { useState, useEffect, useCallback } from 'react';

// Generate a simple session ID
const getSessionId = () => {
  let sid = sessionStorage.getItem('pillarstohome_session_id');
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('pillarstohome_session_id', sid);
  }
  return sid;
};

export const useTracking = () => {
  const sessionId = getSessionId();

  const trackEvent = useCallback((eventType: string, page: string, data?: any) => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, eventType, page, data }),
    }).catch(console.error);
  }, [sessionId]);

  const capturePartialLead = useCallback((data: { name?: string; email?: string; phone?: string; source?: string; budget?: string; intent?: string }) => {
    fetch('/api/leads/partial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...data }),
    }).catch(console.error);
  }, [sessionId]);

  const submitFullLead = useCallback((data: { name: string; email: string; phone: string; source?: string; budget?: string; intent?: string }) => {
    return fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...data }),
    }).then(res => res.json());
  }, [sessionId]);

  return { trackEvent, capturePartialLead, submitFullLead, sessionId };
};
