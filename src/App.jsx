import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronRight } from 'lucide-react';

const SUITS = [
  { s: '♠', id: 's', color: 'text-slate-800' },
  { s: '♥', id: 'h', color: 'text-red-500' },
  { s: '♣', id: 'c', color: 'text-slate-800' },
  { s: '♦', id: 'd', color: 'text-red-500' }
];
const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
const ROUND_NAMES = ['翻前 (Pre-flop)', '翻牌 (Flop)', '转牌 (Turn)', '河牌 (River)', '比牌 (Showdown)'];

const getPositions = (count) => {
  if (count === 4) return ['CO', 'BTN', 'SB', 'BB'];
  if (count === 6) return ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  if (count === 8) return ['UTG', 'UTG+1', 'UTG+2', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  if (count === 9) return ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  return Array.from({ length: count }, (_, i) => `位置 ${i + 1}`);
};

export default function App() {
  const [stage, setStage] = useState('home');
  const [playerCount, setPlayerCount] = useState(6);
  const [sbAmount, setSbAmount] = useState(1);
  const [bbAmount, setBbAmount] = useState(2);
  
  // 引擎核心状态
  const [heroIndex, setHeroIndex] = useState(5); // 默认 BB是自己
  const [heroCards, setHeroCards] = useState([null, null]);
  const [players, setPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [history, setHistory] = useState([]);
  const [historySnapshots, setHistorySnapshots] = useState([]); // 新增：保存每一步大状态的快照，用于撤销
  const [communityCards, setCommunityCards] = useState([]);
  const [bettingRound, setBettingRound] = useState(0); // 0=Pre,1=Flop,2=Turn,3=River
  const [highestBet, setHighestBet] = useState(0);
  const [potSize, setPotSize] = useState(0);
  const [winners, setWinners] = useState([]); // 新增结算赢家状态

  // 弹窗控制
  const [pickingCardsTarget, setPickingCardsFor] = useState(null); // 'hero1','hero2','flop','turn','river'
  const [tempCards, setTempCards] = useState([]);

  // 本地存档功能
  const [isViewingSave, setIsViewingSave] = useState(false);
  const [savedGames, setSavedGames] = useState(() => {
    try {
      const saved = localStorage.getItem('pokerSavedGames');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveCurrentGame = () => {
    const newGame = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      potSize,
      history,
      players: players.filter(p => p.isHero || (p.knownCards && p.knownCards.some(c => c))),
      communityCards,
      sbAmount,
      bbAmount
    };
    const updatedGames = [newGame, ...savedGames];
    setSavedGames(updatedGames);
    localStorage.setItem('pokerSavedGames', JSON.stringify(updatedGames));
    setStage('home');
  };

  const deleteSavedGame = (id) => {
    const updatedGames = savedGames.filter(g => g.id !== id);
    setSavedGames(updatedGames);
    localStorage.setItem('pokerSavedGames', JSON.stringify(updatedGames));
  };

  const loadSavedGame = (game) => {
    setPotSize(game.potSize);
    setHistory(game.history);
    setPlayers(game.players);
    setCommunityCards(game.communityCards || []);
    setIsViewingSave(true);
    setStage('summary');
  };

  const startGame = () => {
    setIsViewingSave(false);
    let positions = getPositions(playerCount);
    let initialPlayers = positions.map((pos, idx) => ({
      id: idx, name: pos, folded: false, allIn: false,
      betThisRound: 0, totalInvested: 0, actedThisRound: false, isHero: idx === heroIndex,
      knownCards: [null, null] // 新增：用于记录他人的已知手牌
    }));
    
    // 如果hero有底牌，先带过去
    initialPlayers[heroIndex].knownCards = [...heroCards];

    // 盲注处理：使用用户自定义配置的大盲小盲
    let bbIdx = playerCount - 1;
    let sbIdx = playerCount - 2;
    initialPlayers[sbIdx].betThisRound = sbAmount;
    initialPlayers[sbIdx].totalInvested = sbAmount;
    initialPlayers[bbIdx].betThisRound = bbAmount;
    initialPlayers[bbIdx].totalInvested = bbAmount;
    
    setPlayers(initialPlayers);
    setPotSize(sbAmount + bbAmount);
    setHighestBet(bbAmount);
    setBettingRound(0);
    setCommunityCards([]);
    setHistory([]);
    setHistorySnapshots([]);
    setWinners([]);
    setCurrentTurn(0); // UTG acts first pre-flop
    setStage('play');
  };

  const formatCard = (c) => {
    if (!c) return <span className="text-slate-300">?</span>;
    const suitObj = SUITS.find(s => s.id === c.suit) || SUITS[0];
    return <span className={`font-bold ${suitObj.color} bg-white shadow-sm border border-slate-200 px-[5px] py-0.5 rounded mx-0.5 inline-block text-center min-w-[1.8rem]`}>{suitObj.s}{c.rank}</span>;
  };

  const saveSnapshot = () => {
    // 深度克隆当前核心状态，推入历史快照栈
    const snapshot = {
      players: JSON.parse(JSON.stringify(players)),
      currentTurn,
      history: [...history],
      communityCards: [...communityCards],
      bettingRound,
      highestBet,
      potSize
    };
    setHistorySnapshots(prev => [...prev, snapshot]);
  };

  const handleUndo = () => {
    if (historySnapshots.length === 0) return;
    const previousState = historySnapshots[historySnapshots.length - 1];
    
    // 恢复状态
    setPlayers(previousState.players);
    setCurrentTurn(previousState.currentTurn);
    setHistory(previousState.history);
    setCommunityCards(previousState.communityCards);
    setBettingRound(previousState.bettingRound);
    setHighestBet(previousState.highestBet);
    setPotSize(previousState.potSize);
    
    // 移除最后一次快照
    setHistorySnapshots(prev => prev.slice(0, -1));
  };

  const handleAction = (actionStr, amount = 0) => {
    saveSnapshot(); // 在发生改变前保存一层快照

    let p = [...players];
    let curr = p[currentTurn];
    curr.actedThisRound = true;
    let historyLog = '';
    let newPot = potSize;
    let newHighest = highestBet;

    if (actionStr === 'Fold') {
      curr.folded = true;
      historyLog = 'Fold';
    } else if (actionStr === 'Check/Call') {
      let toMatch = highestBet - curr.betThisRound;
      if (toMatch === 0) {
        historyLog = 'Check';
      } else {
        curr.betThisRound += toMatch;
        curr.totalInvested += toMatch;
        newPot += toMatch;
        historyLog = `Call ${toMatch}`;
      }
    } else if (actionStr === 'Raise' || actionStr === 'All-in') {
      let amt = parseFloat(amount);
      if (isNaN(amt) || amt <= highestBet) {
          alert('加注后的总额必须大于当前最高下注！'); return;
      }
      let added = amt - curr.betThisRound;
      curr.betThisRound = amt;
      curr.totalInvested += added;
      newPot += added;
      newHighest = amt;
      historyLog = `${actionStr} to ${amt}`;
      if (actionStr === 'All-in') curr.allIn = true;
      
      // 被加注后，后面未弃牌未All-in的人都要重新表态
      p.forEach(player => {
         if (player.id !== curr.id && !player.folded && !player.allIn) {
             player.actedThisRound = false;
         }
      });
    }

    setPotSize(newPot);
    setHighestBet(newHighest);
    setPlayers(p);
    setHistory(h => [...h, { player: curr.name, action: historyLog, round: ROUND_NAMES[bettingRound], pot: newPot }]);
    checkRoundEnd(p, newHighest);
  };

  const checkRoundEnd = (currentPlayers, currentHighestBet) => {
    let activePlayers = currentPlayers.filter(p => !p.folded && !p.allIn);
    let unresolved = activePlayers.filter(p => !p.actedThisRound || p.betThisRound < currentHighestBet);

    if (unresolved.length === 0) {
      if (activePlayers.length + currentPlayers.filter(p => p.allIn && !p.folded).length <= 1) {
        setStage('resolution'); 
        return;
      }
      if (bettingRound === 3) {
        setStage('resolution'); 
        return;
      }
      if (bettingRound === 0) { setTempCards([]); setPickingCardsFor('flop'); }
      if (bettingRound === 1) { setTempCards([]); setPickingCardsFor('turn'); }
      if (bettingRound === 2) { setTempCards([]); setPickingCardsFor('river'); }
    } else {
      findNextActor(currentTurn, currentPlayers);
    }
  };

  const findNextActor = (currentIdx, pList) => {
    let nextIdx = (currentIdx + 1) % pList.length;
    let loopCount = 0;
    while ((pList[nextIdx].folded || pList[nextIdx].allIn) && loopCount < pList.length) {
      nextIdx = (nextIdx + 1) % pList.length;
      loopCount++;
    }
    if (loopCount >= pList.length) setStage('resolution');
    else setCurrentTurn(nextIdx);
  };

  const transitionToNextStreet = (cardsAdded) => {
    saveSnapshot(); // 发公共牌前保存一层快照，方便撤销发牌

    let nextRound = bettingRound + 1;
    setCommunityCards(prev => [...prev, ...cardsAdded]);
    setBettingRound(nextRound);
    
    let p = [...players];
    p.forEach(player => {
      player.betThisRound = 0;
      if (!player.folded && !player.allIn) player.actedThisRound = false;
    });
    setPlayers(p);
    setHighestBet(0);
    setHistory(h => [...h, { isDivider: true, text: `--- 进入 ${ROUND_NAMES[nextRound]} ---`, cards: cardsAdded }]);
    setPickingCardsFor(null);
    setTempCards([]);

    // 翻后由 SB（小盲位，即 playerCount - 2）开始找第一个存活玩家
    findNextActor(playerCount - 3, p); 
  };

  const isCardUsed = (rank, suitId) => {
    if (heroCards.some(c => c && c.rank === rank && c.suit === suitId)) return true;
    if (communityCards.some(c => c && c.rank === rank && c.suit === suitId)) return true;
    if (tempCards.some(c => c && c.rank === rank && c.suit === suitId)) return true;
    for (let p of players) {
      if (p.knownCards && p.knownCards.some(c => c && c.rank === rank && c.suit === suitId)) return true;
    }
    return false;
  };

  const renderCardPicker = () => {
    if (!pickingCardsTarget) return null;
    const requiredCount = pickingCardsTarget === 'flop' ? 3 : 1;
    const isHero = pickingCardsTarget.startsWith('hero');

    const selectCard = (r, s) => {
      if (isCardUsed(r, s.id)) return;
      if (isHero) {
        let newHero = [...heroCards];
        newHero[pickingCardsTarget === 'hero1' ? 0 : 1] = {rank: r, suit: s.id};
        setHeroCards(newHero);
        setPickingCardsFor(null);
      } else if (pickingCardsTarget.startsWith('reveal')) {
        let playerIdx = parseInt(pickingCardsTarget.split('_')[1]);
        let cardPos = parseInt(pickingCardsTarget.split('_')[2]);
        let p = [...players];
        p[playerIdx].knownCards[cardPos] = {rank: r, suit: s.id};
        setPlayers(p);
        setPickingCardsFor(null);
      } else {
        let newTemp = [...tempCards, {rank: r, suit: s.id}];
        setTempCards(newTemp);
        if (newTemp.length === requiredCount) transitionToNextStreet(newTemp);
      }
    };

    return (
      <div className="absolute inset-0 bg-slate-900/90 z-[100] flex flex-col p-4 justify-end transition-all pb-10">
         <div className="bg-white rounded-3xl p-5 shadow-2xl mb-[env(safe-area-inset-bottom)]">
           <h3 className="font-extrabold text-center text-xl mb-6 text-slate-800">
             {isHero ? '挑选我的底牌' : pickingCardsTarget.startsWith('reveal') ? '补录玩家手牌' : `请发公共牌 (${tempCards.length}/${requiredCount})`}
           </h3>
           <div className="grid grid-cols-4 gap-2 mb-2">
              {SUITS.map(s => (
                <div key={s.id} className="flex flex-col gap-1.5 items-center bg-slate-50 rounded-xl py-3 border border-slate-100">
                  <div className={`text-2xl font-black mb-1 ${s.color}`}>{s.s}</div>
                  {RANKS.map(r => {
                    const disabled = isCardUsed(r, s.id);
                    return (
                      <button 
                        key={r} 
                        disabled={disabled}
                        onClick={() => selectCard(r, s)} 
                        className={`w-10 h-8 border border-slate-200 rounded-lg font-black text-sm shadow-sm transition-colors ${
                          disabled ? 'bg-slate-200 text-slate-300 opacity-40 cursor-not-allowed' : `bg-white active:bg-blue-100 ${s.color}`
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              ))}
           </div>
           {(isHero || pickingCardsTarget.startsWith('reveal')) && <button onClick={() => setPickingCardsFor(null)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold mt-4 shadow-inner">取消 / 稍后补录</button>}
         </div>
      </div>
    );
  };

  // ---------------- UI 渲染 ----------------
  const renderHome = () => (
    <div className="flex flex-col items-center min-h-screen p-6 bg-slate-900 text-white select-none">
      <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
        <h1 className="text-5xl font-extrabold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 pb-1">Poker+</h1>
        <p className="text-slate-400 mb-12 tracking-widest text-sm text-center">专业错题本 • 真德扑状态机复盘</p>
        <button onClick={() => setStage('setup')} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-500/50 active:scale-95 transition-transform mb-12">
          <Play size={20} className="fill-current" /><span>新建复盘牌局</span>
        </button>
      </div>

      <div className="w-full max-w-sm pb-10">
        <h3 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2">本地存档记录 ({savedGames.length})</h3>
        {savedGames.length === 0 ? (
           <p className="text-slate-500 text-sm text-center py-4">暂无存档记录</p>
        ) : (
          <div className="flex flex-col space-y-3">
             {savedGames.map(game => (
               <div key={game.id} onClick={() => loadSavedGame(game)} className="bg-slate-800 rounded-2xl p-4 flex flex-col relative border border-slate-700 shadow-md cursor-pointer hover:bg-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <div className="text-xs text-slate-400 font-mono">{game.date}</div>
                     <button onClick={(e) => { e.stopPropagation(); deleteSavedGame(game.id); }} className="text-red-400 text-xs px-2 py-1 bg-red-400/10 rounded-md hover:bg-red-400/20 active:scale-95">删除</button>
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                        <div className="text-sm font-bold text-emerald-400 mb-1">盲注 {game.sbAmount}/{game.bbAmount}</div>
                        <div className="flex space-x-1">
                          {game.players.map(p => (
                             <div key={p.id} className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{p.name}{p.isHero ? ' 🐶' : ''}</div>
                          ))}
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] text-slate-500 mb-0.5">底池</div>
                        <div className="text-xl font-black text-amber-400">{game.potSize}</div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="flex flex-col p-5 min-h-screen bg-slate-100 select-none">
      <h2 className="text-2xl font-black mb-6 text-slate-800 pt-6">配置对局参数</h2>
      
      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-4">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">1. 选择桌上人数</div>
        <div className="grid grid-cols-4 gap-2">
          {[4, 6, 8, 9].map(num => (
            <button key={num} onClick={() => { setPlayerCount(num); setHeroIndex(num-1); }} className={`py-3 rounded-xl font-bold text-sm ${playerCount === num ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>{num}人</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-4">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">2. 设定本局盲注大小</div>
        <div className="flex space-x-4">
          <div className="flex-1">
             <label className="block text-[10px] font-black text-slate-400 mb-2">小盲 (SB)</label>
             <input type="number" pattern="[0-9]*" value={sbAmount} onChange={(e) => setSbAmount(Number(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
          </div>
          <div className="flex-1">
             <label className="block text-[10px] font-black text-slate-400 mb-2">大盲 (BB)</label>
             <input type="number" pattern="[0-9]*" value={bbAmount} onChange={(e) => setBbAmount(Number(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-4">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">3. 我 (Hero) 的位置在哪？</div>
        <div className="grid grid-cols-4 gap-2">
          {getPositions(playerCount).map((pos, idx) => (
            <button key={idx} onClick={() => setHeroIndex(idx)} className={`py-2.5 rounded-xl font-bold text-xs ${heroIndex === idx ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>{pos}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-6">
        <div className="text-xs font-bold text-slate-400 mb-4 uppercase">3. 记录我拿到的底牌 (选填)</div>
        <div className="flex justify-center space-x-4">
           <div onClick={() => setPickingCardsFor('hero1')} className="w-20 h-28 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-3xl cursor-pointer bg-slate-50 hover:bg-slate-100">
              {formatCard(heroCards[0])}
           </div>
           <div onClick={() => setPickingCardsFor('hero2')} className="w-20 h-28 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-3xl cursor-pointer bg-slate-50 hover:bg-slate-100">
              {formatCard(heroCards[1])}
           </div>
        </div>
      </div>

      <button onClick={startGame} className="mt-auto mb-6 bg-slate-800 text-white p-5 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform flex justify-center shadow-xl">
        进入桌台发牌 <ChevronRight className="ml-2 w-6 h-6"/>
      </button>
      {renderCardPicker()}
    </div>
  );

  const SwipeCard = ({ player }) => {
    const onDragEnd = (_, { offset }) => {
      if (offset.x < -60) handleAction('Check/Call');
      else if (offset.x > 60) handleAction('Fold');
    };
    const onRaise = () => {
      const amt = prompt(`当前单次最高下注额为 ${highestBet}。\n在此基础上，你要加注到多少？(To)`);
      if (amt) handleAction('Raise', amt);
    };

    return (
      <div className="flex flex-col items-center w-full h-[320px] justify-center relative mt-4">
        <AnimatePresence mode="popLayout">
          <motion.div key={`${player.id}-${history.length}`} drag="x" dragSnapToOrigin={true} dragElastic={0.4} onDragEnd={onDragEnd}
            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -30 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_15px_50px_rgb(0,0,0,0.15)] border border-slate-100 p-8 flex flex-col items-center absolute z-20"
          >
            <div className={`px-4 py-1.5 rounded-full mb-5 font-black text-xs tracking-wider shadow-sm border-2 ${player.isHero ? 'bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border-amber-400' : 'bg-slate-100 text-slate-500 border-transparent'}`}>
              {player.isHero ? '👑 我 (Hero) 的行动回合' : '其他玩家行动中'}
            </div>
            
            <h3 className={`text-4xl font-black mb-3 ${player.isHero ? 'text-amber-500' : 'text-slate-800'}`}>{player.name}</h3>
            
            <div className="bg-slate-50 px-4 py-2 rounded-xl mb-6 border border-slate-100 text-center">
               <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-1">本轮已下注 {player.betThisRound}</p>
               <p className="text-slate-700 font-black text-sm">还需补足 <span className="text-blue-600 text-lg">{Math.max(0, highestBet - player.betThisRound)}</span> {Math.max(0, highestBet - player.betThisRound) === 0 ? '(可过牌)' : ''}</p>
            </div>

            <div className="flex justify-between w-full text-[10px] font-black text-slate-300 mb-8 uppercase px-1">
              <span className="text-red-400/80">← 左滑 Fold</span>
              <span className="text-emerald-500/80">右滑 {(highestBet === 0 || player.betThisRound === highestBet) ? 'Check' : 'Call'} →</span>
            </div>

            <div className="grid grid-cols-4 gap-2 w-full">
              <button onClick={() => handleAction('Fold')} className="bg-red-50 text-red-600 font-bold py-3.5 rounded-xl text-xs active:bg-red-100">Fold</button>
              <button onClick={() => handleAction('Check/Call')} className="bg-emerald-50 text-emerald-600 font-bold py-3.5 rounded-xl text-xs col-span-2 shadow-sm active:bg-emerald-100">
                 {(highestBet === 0 || player.betThisRound === highestBet) ? 'Check' : `Call (${highestBet - player.betThisRound})`}
              </button>
              <button onClick={onRaise} className="bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs shadow-md active:bg-slate-700">Raise</button>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="w-11/12 h-[300px] bg-slate-300/30 rounded-[2.5rem] absolute z-10 translate-y-3 scale-95"></div>
      </div>
    );
  };

  const renderPlay = () => {
    const activePlayer = players[currentTurn];
    if (!activePlayer) return null;
    return (
    <div className="flex flex-col min-h-screen max-h-screen bg-slate-50 relative select-none">
      {/* 顶部状态板 - 改为 flex-none 防压缩 */}
      <div className="flex-none bg-slate-900 text-white px-6 pt-8 pb-6 rounded-b-[2rem] shadow-lg z-10 relative">
        {/* 撤销按钮 (仅在有历史快照时显示) */}
        {historySnapshots.length > 0 && (
          <button 
            onClick={handleUndo} 
            className="absolute top-8 right-6 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 px-3 py-1.5 rounded-full font-bold text-slate-300 flex items-center shadow-sm active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="mr-1.5"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            撤销上一步
          </button>
        )}

        <div className="flex justify-between items-end mb-4 pr-24">
           <div>
             <div className="text-xs text-slate-400 font-black tracking-widest uppercase mb-1">Current Round</div>
             <div className="text-amber-400 font-black text-2xl tracking-wider">{ROUND_NAMES[bettingRound].split(' ')[0]}</div>
           </div>
           <div className="text-right">
              <div className="text-xs text-slate-400 font-black tracking-widest uppercase mb-1">Pot Size</div>
              <div className="text-4xl font-black text-white">{potSize}</div>
           </div>
        </div>
        
        {/* 卡牌显示区 */}
        <div className="flex justify-between items-end border-t border-slate-700/50 pt-4">
           <div className="flex flex-col">
             <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">My Hand</div>
             <div className="flex">{formatCard(heroCards[0])}{formatCard(heroCards[1])}</div>
           </div>
           <div className="flex flex-col items-end">
             <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Community</div>
             <div className="flex min-h-[28px]">{communityCards.length === 0 ? <span className="text-sm font-bold text-slate-500 italic">等待发牌</span> : communityCards.map((c, i) => <span key={i}>{formatCard(c)}</span>)}</div>
           </div>
        </div>
      </div>

      {/* 中心交互卡片 - 改为 flex-1 自适应剩余高度 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 z-0 min-h-[300px] overflow-hidden">
         <SwipeCard player={activePlayer} />
      </div>

      {/* 底部玩家状态条 - 改为普通文档流排布，脱离 absolute 导致重叠的问题 */}
      <div className="flex-none w-full p-4 pb-6 bg-slate-100 border-t border-slate-200 z-40">
         <div className="flex justify-between text-[11px] text-slate-500 mb-3 font-black tracking-wider uppercase px-1">点击玩家可补录死牌/亮牌</div>
         <div className="flex flex-wrap gap-2">
           {players.map((p, i) => (
             <div key={i} className={`flex flex-col px-3 py-1.5 border-2 rounded-xl text-[10px] font-black uppercase relative z-50
               ${p.id === currentTurn ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-md transform scale-105' : p.folded ? 'bg-slate-100/50 border-transparent text-slate-300 line-through' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
               <div className="flex justify-between items-center w-full">
                 <span>{p.name}{p.isHero?' 👑':''}</span>
               </div>
               
               {/* 补录手牌的微型插槽 */}
               {!p.isHero && (
                  <div className="flex mt-1 space-x-1">
                    <div onClick={(e) => { e.stopPropagation(); setPickingCardsFor(`reveal_${p.id}_0`) }} className="w-5 h-6 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[10px] cursor-pointer hover:bg-slate-200">
                      {p.knownCards?.[0] ? formatCard(p.knownCards[0]) : '?'}
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); setPickingCardsFor(`reveal_${p.id}_1`) }} className="w-5 h-6 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[10px] cursor-pointer hover:bg-slate-200">
                      {p.knownCards?.[1] ? formatCard(p.knownCards[1]) : '?'}
                    </div>
                  </div>
               )}

               <span className={`text-[11px] mt-1 ${p.id === currentTurn ? 'text-blue-600' : 'text-slate-400'}`}>
                  {p.folded ? 'Fold' : `池:${p.betThisRound}`}
               </span>
             </div>
           ))}
         </div>
      </div>
      {renderCardPicker()}
    </div>
  )};

  const renderResolution = () => {
    const activePlayers = players.filter(p => !p.folded);
    const isShowdown = activePlayers.length > 1;

    const toggleWinner = (id) => {
       if (winners.includes(id)) {
           setWinners(winners.filter(w => w !== id));
       } else {
           setWinners([...winners, id]);
       }
    };

    const finishHand = () => {
      if (winners.length === 0) {
        if (!confirm("您还未选择赢家，确定要跳过直接看复盘吗？")) return;
      }
      
      if (winners.length > 0) {
         let winnerNames = winners.map(wid => players.find(p=>p.id===wid)?.name).join(' & ');
         setHistory(h => [...h, { 
             isDivider: true, 
             text: '--- 结算 (Showdown / Fold) ---',
             cards: [] 
         }, {
            player: '👑',
            action: `${winnerNames} 赢下底池: ${potSize}`,
            pot: potSize,
            isWinLog: true
         }]);
      }
      setStage('summary');
    };

    return (
      <div className="flex flex-col min-h-screen bg-slate-50 relative select-none">
        <div className="flex flex-col px-6 pt-10 pb-6 bg-slate-900 shadow-xl rounded-b-[2rem] z-10 font-sans">
          <h2 className="text-2xl font-black text-white mb-2">对局结束结算</h2>
          <p className="text-slate-400 text-sm">请指定赢家并补录残存玩家的亮牌</p>
          <div className="mt-4 p-4 bg-slate-800 rounded-2xl flex justify-between items-center border border-slate-700">
             <span className="text-slate-300 font-bold uppercase tracking-wider text-xs">Final Pot Size</span>
             <span className="text-3xl font-black text-amber-400">{potSize}</span>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto z-0 pb-20">
           {isShowdown && (
             <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm font-bold shadow-sm">
                比牌阶段！目前有 {activePlayers.length} 名玩家坚持到了最后，请点击下方的卡槽记录他们的底牌。
             </div>
           )}

           <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-1">本局仍存活在场上的玩家：</h3>
           <div className="flex flex-col gap-3">
             {activePlayers.map(p => {
               const isWin = winners.includes(p.id);
               return (
                 <div key={p.id} onClick={() => toggleWinner(p.id)} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${isWin ? 'bg-amber-50 border-amber-400 shadow-md' : 'bg-white border-slate-200 shadow-sm'}`}>
                   <div className="flex items-center space-x-3">
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isWin ? 'border-amber-500 bg-amber-500 text-white font-black text-xs' : 'border-slate-300'}`}>
                        {isWin && '✓'}
                     </div>
                     <span className={`font-black text-lg ${isWin ? 'text-amber-700' : 'text-slate-700'} ${p.isHero ? 'text-blue-600' : ''}`}>
                       {p.name}{p.isHero && ' 👑'}
                     </span>
                   </div>
                   
                   {/* 补录牌插槽 (阻止事件冒泡，不触发勾选赢家) */}
                   <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                      <div onClick={() => setPickingCardsFor(`reveal_${p.id}_0`)} className="w-10 h-14 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center text-sm cursor-pointer hover:bg-slate-200 shadow-inner">
                        {p.knownCards?.[0] ? formatCard(p.knownCards[0]) : '?'}
                      </div>
                      <div onClick={() => setPickingCardsFor(`reveal_${p.id}_1`)} className="w-10 h-14 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center text-sm cursor-pointer hover:bg-slate-200 shadow-inner">
                        {p.knownCards?.[1] ? formatCard(p.knownCards[1]) : '?'}
                      </div>
                   </div>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-100 z-40">
           <button onClick={finishHand} className={`w-full py-4 text-lg font-black text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center ${winners.length > 0 ? 'bg-amber-500' : 'bg-slate-800'}`}>
             {winners.length > 0 ? `确认赢家并生成复盘` : '跳过输赢直接看复盘'}
           </button>
        </div>
        {renderCardPicker()}
      </div>
    );
  };

  const renderSummary = () => (
    <div className="flex flex-col p-6 min-h-screen bg-slate-100 select-none">
      <div className="pt-8 mb-6">
        <h2 className="text-3xl font-black text-slate-800 mb-2">手牌复盘生成</h2>
        <p className="text-sm font-bold text-slate-400 flex items-center">
           总底池: <span className="bg-slate-800 text-white px-2 py-0.5 rounded-lg ml-2 font-mono text-lg">{potSize}</span>
        </p>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm p-5 mb-8 flex-1 overflow-y-auto w-full no-scrollbar">
          {/* 顶部展示本局已知手牌 */}
          <div className="mb-6 flex flex-wrap gap-3 pb-4 border-b-2 border-slate-100">
             <div className="text-xs font-bold text-slate-400 mb-1 w-full">本局已知手牌：</div>
           {players.map(p => {
             if (p.isHero || (p.knownCards && p.knownCards.some(c => c !== null))) {
               return (
                 <div key={p.id} className={`flex flex-col items-center p-2 rounded-xl border ${p.isHero ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-xs font-black mb-1 text-slate-600">{p.name}{p.isHero ? ' 👑' : ''}</span>
                    <div className="flex">
                      {p.knownCards[0] ? formatCard(p.knownCards[0]) : <span className="text-slate-300 mx-1">?</span>}
                      {p.knownCards[1] ? formatCard(p.knownCards[1]) : <span className="text-slate-300 mx-1">?</span>}
                    </div>
                 </div>
               )
             }
             return null;
           })}
        </div>

        {history.map((h, i) => {
          if (h.isDivider) {
            return (
              <div key={i} className="my-5 pt-5 border-t-2 border-dashed border-slate-100 text-center">
                 <span className="bg-amber-100 text-amber-800 px-4 py-1.5 text-xs font-black rounded-xl tracking-wider">{h.text}</span>
                 {h.cards && h.cards.length > 0 && <div className="mt-3 flex justify-center">{h.cards.map((c, j)=><span key={j}>{formatCard(c)}</span>)}</div>}
              </div>
            );
          }
          return (
            <div key={i} className={`flex items-center mb-3 text-sm p-3 rounded-xl border ${h.isWinLog ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
              <span className="w-16 font-black text-slate-700 text-center">{h.player}</span>
              <span className={`flex-1 font-bold ${h.action.includes('Fold') ? 'text-red-400' : h.action.includes('Call') || h.action.includes('Check') ? 'text-emerald-500' : h.isWinLog ? 'text-amber-600 font-black' : 'text-blue-600'}`}>{h.action}</span>
              {!h.isWinLog && <span className="text-xs text-slate-400 font-mono bg-white px-2 py-1 rounded shadow-sm border border-slate-200">Pot: {h.pot}</span>}
            </div>
          );
        })}
      </div>
      
      {isViewingSave ? (
        <button onClick={() => setStage('home')} className="mt-auto mb-6 bg-slate-800 text-white p-5 rounded-2xl font-bold text-lg active:scale-95 transition-transform flex justify-center shadow-xl">
          返回首页
        </button>
      ) : (
        <button onClick={saveCurrentGame} className="mt-auto mb-6 bg-emerald-600 hover:bg-emerald-500 text-white p-5 rounded-2xl font-bold text-lg active:scale-95 transition-transform flex justify-center shadow-xl">
          保存记录并返回首页
        </button>
      )}
    </div>
  );

  return (
    <div className="font-sans max-w-md mx-auto relative bg-slate-900 border-x border-slate-800 min-h-screen shadow-2xl overflow-hidden">
      {stage === 'home' && renderHome()}
      {stage === 'setup' && renderSetup()}
      {stage === 'play' && renderPlay()}
      {stage === 'resolution' && renderResolution()}
      {stage === 'summary' && renderSummary()}
    </div>
  );
}