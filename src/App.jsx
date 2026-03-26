import React from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import SetupScreenV2 from './screens/SetupScreenV2';
import PlayScreen from './screens/PlayScreen';
import ResolutionScreen from './screens/ResolutionScreen';
import SummaryScreen from './screens/SummaryScreen';

function AppRouter() {
  const { stage } = useGame();

  return (
    <div className="font-sans max-w-md mx-auto relative bg-slate-900 border-x border-slate-800 min-h-screen shadow-2xl overflow-hidden">
      {stage === 'home' && <HomeScreen />}
      {stage === 'setup' && <SetupScreen />}
      {stage === 'setupV2' && <SetupScreenV2 />}
      {stage === 'play' && <PlayScreen />}
      {stage === 'resolution' && <ResolutionScreen />}
      {stage === 'summary' && <SummaryScreen />}
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