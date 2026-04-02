import React, { lazy, Suspense, useState } from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import HomeScreen from './screens/HomeScreen';
import BottomTabBar from './components/BottomTabBar';

// Lazy-loaded screens — only downloaded when the user navigates to them
const SetupScreen = lazy(() => import('./screens/SetupScreen'));
const SetupScreenV2 = lazy(() => import('./screens/SetupScreenV2'));
const PlayScreen = lazy(() => import('./screens/PlayScreen'));
const ResolutionScreen = lazy(() => import('./screens/ResolutionScreen'));
const SummaryScreen = lazy(() => import('./screens/SummaryScreen'));
const ToolsScreen = lazy(() => import('./screens/ToolsScreen'));
const LedgerScreen = lazy(() => import('./screens/LedgerScreen'));
const TableLedgerScreen = lazy(() => import('./screens/TableLedgerScreen'));
const EquityScreen = lazy(() => import('./screens/EquityScreen'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRouter() {
  const { stage } = useGame();
  const [activeTab, setActiveTab] = useState('record');
  const [toolsSubScreen, setToolsSubScreen] = useState(null); // 'ledger' | null

  const isHome = stage === 'home';

  const handleToolsNavigate = (screenId) => setToolsSubScreen(screenId);
  const handleToolsBack = () => setToolsSubScreen(null);

  // When tab changes, reset tools sub-screen
  const handleTabChange = (id) => {
    setActiveTab(id);
    setToolsSubScreen(null);
  };

  const renderHomeContent = () => {
    if (activeTab === 'tools') {
      if (toolsSubScreen === 'ledger') return <LedgerScreen onBack={handleToolsBack} />;
      if (toolsSubScreen === 'tableLedger') return <TableLedgerScreen onBack={handleToolsBack} />;
      if (toolsSubScreen === 'equity') return <EquityScreen onBack={handleToolsBack} />;
      return <ToolsScreen onNavigate={handleToolsNavigate} />;
    }
    return <HomeScreen />;
  };

  return (
    <div className="font-sans max-w-md mx-auto relative bg-slate-900 border-x border-slate-800 min-h-screen shadow-2xl overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        {isHome && renderHomeContent()}
        {stage === 'setup'      && <SetupScreen />}
        {stage === 'setupV2'    && <SetupScreenV2 />}
        {stage === 'play'       && <PlayScreen />}
        {stage === 'resolution' && <ResolutionScreen />}
        {stage === 'summary'    && <SummaryScreen />}
      </Suspense>
      {isHome && <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}
