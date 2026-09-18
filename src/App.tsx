import { AuthProvider, useAuth } from '@/lib/auth';
import AuthPage from '@/pages/AuthPage';
import Sidebar from '@/components/Sidebar';
import LiveSimulation from '@/tabs/LiveSimulation';
import AlgorithmAnalytics from '@/tabs/AlgorithmAnalytics';
import GpsErrorMetrics from '@/tabs/GpsErrorMetrics';
import DatasetExplorer from '@/tabs/DatasetExplorer';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export type TabId = 'live' | 'analytics' | 'errors' | 'datasets';

function AppContent() {
  const { session, loading } = useAuth();
  const [tab, setTab] = useState<TabId>('live');

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#070b14]">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b14] text-slate-200">
      <Sidebar active={tab} onChange={setTab} />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === 'live' && <LiveSimulation />}
        {tab === 'analytics' && <AlgorithmAnalytics />}
        {tab === 'errors' && <GpsErrorMetrics />}
        {tab === 'datasets' && <DatasetExplorer />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
