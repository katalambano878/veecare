'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import NavigationProgress from '@/components/NavigationProgress';
import IdleWidgets from '@/components/IdleWidgets';
import { CMSProvider } from '@/context/CMSContext';

import dynamic from 'next/dynamic';

const SessionTimeoutWarning = dynamic(() => import('@/components/SessionTimeoutWarning'), { ssr: false });
const PWAPrompt = dynamic(() => import('@/components/PWAPrompt'), { ssr: false });
const PWAInstaller = dynamic(() => import('@/components/PWAInstaller'), { ssr: false });
const PWASplash = dynamic(() => import('@/components/PWASplash'), { ssr: false });
const OfflineIndicator = dynamic(() => import('@/components/OfflineIndicator'), { ssr: false });
const NetworkStatusMonitor = dynamic(() => import('@/components/NetworkStatusMonitor'), { ssr: false });
const UpdatePrompt = dynamic(() => import('@/components/UpdatePrompt'), { ssr: false });
const LiveSalesNotification = dynamic(() => import('@/components/LiveSalesNotification'), { ssr: false });
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });
const ScrollToTopLazy = dynamic(() => import('@/components/ScrollToTop'), { ssr: false });

export default function StoreLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CMSProvider>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <div className="store-canvas min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <Header />
        <ErrorBoundary>
          <div className="pwa-page-enter">{children}</div>
        </ErrorBoundary>
        <Footer />
        <IdleWidgets>
          <PWASplash />
          <PWAInstaller />
          <SessionTimeoutWarning />
          <PWAPrompt />
          <OfflineIndicator />
          <NetworkStatusMonitor />
          <UpdatePrompt />
          <LiveSalesNotification />
          <ChatWidget />
          <ScrollToTopLazy />
        </IdleWidgets>
      </div>
      <MobileBottomNav />
    </CMSProvider>
  );
}
