import React, { useState } from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import SetupScreenV2 from './screens/SetupScreenV2';
import PlayScreen from './screens/PlayScreen';
import ResolutionScreen from './screens/ResolutionScreen';
import SummaryScreen from './screens/SummaryScreen';
import ToolsScreen from './screens/ToolsScreen';
import LedgerScreen from './screens/LedgerScreen';
import TableLedgerScreen from './screens/TableLedgerScreen';
import EquityScreen from './screens/EquityScreen';
import BottomTabBar from './components/BottomTabBar';

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
      {isHome && renderHomeContent()}
      {stage === 'setup'      && <SetupScreen />}
      {stage === 'setupV2'    && <SetupScreenV2 />}
      {stage === 'play'       && <PlayScreen />}
      {stage === 'resolution' && <ResolutionScreen />}
      {stage === 'summary'    && <SummaryScreen />}
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
