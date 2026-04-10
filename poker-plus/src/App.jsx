import React, { useState } from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import { AuthProvider } from './contexts/AuthContext';
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

// Community
import CommunityFeed from './screens/community/CommunityFeed';
import PostDetail from './screens/community/PostDetail';
import CreatePost from './screens/community/CreatePost';
import SearchPage from './screens/community/SearchPage';
import SettingsPage from './screens/community/SettingsPage';
import UserProfile from './screens/community/UserProfile';
import NotificationsPage from './screens/community/NotificationsPage';
import MyLikesPage from './screens/community/MyLikesPage';
import AboutPage from './screens/community/AboutPage';
import FeedbackPage from './screens/community/FeedbackPage';
import NotificationSettingsPage from './screens/community/NotificationSettingsPage';
import LoginPage from './screens/auth/LoginPage';
import RegisterPage from './screens/auth/RegisterPage';

function AppRouter() {
  const { stage } = useGame();
  const [activeTab, setActiveTab]       = useState('record');
  const [toolsSubScreen, setToolsSubScreen] = useState(null);

  // Community navigation stack: [{ screen, params }]
  const [communityNav, setCommunityNav] = useState([{ screen: 'feed' }]);
  // "我的" navigation stack: [{ screen, params }]
  const [meNav, setMeNav]               = useState([{ screen: 'settings' }]);

  const isHome = stage === 'home';

  const handleTabChange = (id) => {
    setActiveTab(id);
    setToolsSubScreen(null);
    if (id === 'community') setCommunityNav([{ screen: 'feed' }]);
    if (id === 'me')        setMeNav([{ screen: 'settings' }]);
  };

  // ── Community nav helpers ─────────────────────────────────────
  const communityPush = (item) => setCommunityNav(prev => [...prev, item]);
  const communityPop  = () => setCommunityNav(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  const renderCommunityScreen = () => {
    const current = communityNav[communityNav.length - 1];
    switch (current.screen) {
      case 'post':
        return (
          <PostDetail
            postId={current.params?.postId}
            onBack={communityPop}
            onNavigate={communityPush}
          />
        );
      case 'create':
        return (
          <CreatePost
            onBack={communityPop}
            initialData={current.params}
            onSuccess={(id) => {
              communityPop();
              if (id && !id.startsWith('mock-')) {
                communityPush({ screen: 'post', params: { postId: id } });
              }
            }}
          />
        );
      case 'editPost':
        return (
          <CreatePost
            onBack={communityPop}
            initialData={{ editPost: current.params?.post }}
            onSuccess={(id) => {
              // Pop editPost + the underlying post, then push fresh post detail
              setCommunityNav(prev => {
                const base = prev.slice(0, -2);
                return [...base, { screen: 'post', params: { postId: id } }];
              });
            }}
          />
        );
      case 'search':
        return <SearchPage onBack={communityPop} onNavigate={communityPush} />;
      case 'notifications':
        return <NotificationsPage onBack={communityPop} onNavigate={communityPush} />;
      case 'userProfile':
        return (
          <UserProfile
            userId={current.params?.userId}
            onBack={communityPop}
            onNavigate={communityPush}
          />
        );
      case 'login':
        return (
          <LoginPage
            onBack={communityPop}
            onSuccess={communityPop}
            onGoRegister={() => setCommunityNav(prev => [...prev.slice(0, -1), { screen: 'register' }])}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onBack={communityPop}
            onSuccess={communityPop}
            onGoLogin={() => setCommunityNav(prev => [...prev.slice(0, -1), { screen: 'login' }])}
          />
        );
      default:
        return <CommunityFeed onNavigate={communityPush} />;
    }
  };

  // ── "我的" nav helpers ────────────────────────────────────────
  const mePush = (item) => setMeNav(prev => [...prev, item]);
  const mePop  = () => setMeNav(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  const renderMeScreen = () => {
    const current = meNav[meNav.length - 1];
    switch (current.screen) {
      case 'userProfile':
        return (
          <UserProfile
            userId={current.params?.userId}
            onBack={mePop}
            onNavigate={mePush}
          />
        );
      case 'myPosts':
        return (
          <UserProfile
            userId={current.params?.userId}
            onBack={mePop}
            onNavigate={mePush}
          />
        );
      case 'post':
        return (
          <PostDetail
            postId={current.params?.postId}
            onBack={mePop}
            onNavigate={mePush}
          />
        );
      case 'editPost':
        return (
          <CreatePost
            onBack={mePop}
            initialData={{ editPost: current.params?.post }}
            onSuccess={(id) => {
              setMeNav(prev => {
                const base = prev.slice(0, -2);
                return [...base, { screen: 'post', params: { postId: id } }];
              });
            }}
          />
        );
      case 'myLikes':
        return <MyLikesPage onBack={mePop} onNavigate={mePush} />;
      case 'about':
        return <AboutPage onBack={mePop} />;
      case 'feedback':
        return <FeedbackPage onBack={mePop} />;
      case 'notificationSettings':
        return <NotificationSettingsPage onBack={mePop} />;
      case 'login':
        return (
          <LoginPage
            onBack={mePop}
            onSuccess={mePop}
            onGoRegister={() => setMeNav(prev => [...prev.slice(0, -1), { screen: 'register' }])}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onBack={mePop}
            onSuccess={mePop}
            onGoLogin={() => setMeNav(prev => [...prev.slice(0, -1), { screen: 'login' }])}
          />
        );
      default:
        // settings (root) — no back button on root
        return <SettingsPage onBack={() => {}} onNavigate={mePush} />;
    }
  };

  // ── Share to community (from SummaryScreen) ──────────────────
  const handleShareToCommunity = (replayData) => {
    setActiveTab('community');
    setCommunityNav([
      { screen: 'feed' },
      { screen: 'create', params: { replayData, type: 'replay' } },
    ]);
  };

  // ── Route home content ────────────────────────────────────────
  const renderHomeContent = () => {
    if (activeTab === 'community') return renderCommunityScreen();
    if (activeTab === 'me')        return renderMeScreen();
    if (activeTab === 'tools') {
      if (toolsSubScreen === 'ledger')      return <LedgerScreen onBack={() => setToolsSubScreen(null)} />;
      if (toolsSubScreen === 'tableLedger') return <TableLedgerScreen onBack={() => setToolsSubScreen(null)} />;
      if (toolsSubScreen === 'equity')      return <EquityScreen onBack={() => setToolsSubScreen(null)} />;
      return <ToolsScreen onNavigate={setToolsSubScreen} />;
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
      {stage === 'summary'    && <SummaryScreen onShareToCommunity={handleShareToCommunity} />}
      {isHome && <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <AppRouter />
      </GameProvider>
    </AuthProvider>
  );
}
