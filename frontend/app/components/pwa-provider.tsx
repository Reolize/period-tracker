'use client';

import { useEffect } from 'react';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope);

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New version available');
                    // Optionally show update notification
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      });

      // Handle beforeinstallprompt for custom install button
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        // Store the event for later use
        (window as any).deferredPrompt = e;
        console.log('[PWA] App is installable');
      });

      // Handle app installed
      window.addEventListener('appinstalled', () => {
        console.log('[PWA] App was installed');
        (window as any).deferredPrompt = null;
      });
    }
  }, []);

  return <>{children}</>;
}
