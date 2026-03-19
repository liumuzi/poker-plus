import React, { useState, useRef } from 'react';
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
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startPos.current = {
      x: e.pageX,
      y: e.pageY,
      scrollLeft: scrollRef.current?.scrollLeft || 0,
      scrollTop: scrollRef.current?.scrollTop || 0
    };
  };

  const handleMouseLeave = () => { isDragging.current = false; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const y = e.pageY;
    const walkX = x - startPos.current.x;
    const walkY = y - startPos.current.y;
    scrollRef.current.scrollLeft = startPos.current.scrollLeft - walkX;
    scrollRef.current.scrollTop = startPos.current.scrollTop - walkY;
  };

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
    setHistory([
      { player: initialPlayers[sbIdx].name, action: `小盲 $${sbAmount}`, pot: sbAmount, isHero: initialPlayers[sbIdx].isHero },
      { player: initialPlayers[bbIdx].name, action: `大盲 $${bbAmount}`, pot: sbAmount + bbAmount, isHero: initialPlayers[bbIdx].isHero },
      { isDivider: true, text: '--- 进入 翻前 (Pre-flop) ---', cards: [] }
    ]);
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
    } else if (actionStr === 'Raise') {
      let amt = parseFloat(amount);
      if (isNaN(amt) || amt <= highestBet) {
          alert('加注后的总额必须大于当前最高下注！'); return;
      }
      let added = amt - curr.betThisRound;
      curr.betThisRound = amt;
      curr.totalInvested += added;
      newPot += added;
      newHighest = amt;
      historyLog = `Raise to ${amt}`;
      
      // 被加注后，后面未弃牌未All-in的人都要重新表态
      p.forEach(player => {
         if (player.id !== curr.id && !player.folded && !player.allIn) {
             player.actedThisRound = false;
         }
      });
    } else if (actionStr === 'All-in') {
      let amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) return;
      
      let added = Math.max(0, amt - curr.betThisRound);
      curr.betThisRound = amt;
      curr.totalInvested += added;
      newPot += added;
      curr.allIn = true;
      historyLog = `All-in ${amt}`;

      if (amt > highestBet) {
         newHighest = amt;
         // 如果 All-in 的金额大于最高下注，算作加注，需要后面的人重新表态
         p.forEach(player => {
            if (player.id !== curr.id && !player.folded && !player.allIn) {
                player.actedThisRound = false;
            }
         });
      }
    }

    setPotSize(newPot);
    setHighestBet(newHighest);
    setPlayers(p);
    setHistory(h => [...h, { player: curr.name, isHero: curr.isHero, action: historyLog, round: ROUND_NAMES[bettingRound], pot: newPot }]);
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

    let activeCount = p.filter(pl => !pl.folded && !pl.allIn).length;
    let standingCount = p.filter(pl => !pl.folded).length;

    // 当仅有1人存活（未弃牌）时，确实不需要发后续公共牌，直接结算
    if (standingCount <= 1 || nextRound >= 4) {
      setStage('resolution');
      return;
    }

    // Bug 修复：如果场上虽然有多人存活，但已经没有人能继续行动（全都 All-in了）
    // 不能去 findNextActor，否则会导致找不到人而强行跳过后面的发牌进入结局！
    if (activeCount === 0) {
      if (nextRound === 1) setPickingCardsFor('turn');
      else if (nextRound === 2) setPickingCardsFor('river');
      else if (nextRound >= 3) setStage('resolution');
      return;
    }

    // 翻后由 SB（小盲位，即 playerCount - 2）开始找第一个存活且可行动的玩家
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
  const renderHome = () => {
    const loadTestCase = () => {
      setPotSize(72);
      setSbAmount(1);
      setBbAmount(2);
      setPlayers([
        { id: 1, name: 'imafish', isHero: false, knownCards: [null, null] },
        { id: 2, name: 'Nikola..', isHero: false, knownCards: [null, null] },
        { id: 3, name: 'rd8121', isHero: false, knownCards: [null, null] },
        { id: 4, name: 'Godz1lla', isHero: false, knownCards: [null, null] },
        { id: 5, name: 'moq66', isHero: false, knownCards: [null, null] },
        { id: 6, name: 'Lucife..', isHero: true, knownCards: [{rank:'J', suit:'s'}, {rank:'T', suit:'s'}] },
      ]);
      setCommunityCards([{rank:'9',suit:'d'}, {rank:'5',suit:'c'}, {rank:'7',suit:'s'}, {rank:'8',suit:'h'}, {rank:'K',suit:'h'}]);
      setHistory([
         { player: 'Lucife..', action: '小盲 $1', pot: 1, isHero: true },
         { player: 'moq66', action: '大盲 $2', pot: 3, isHero: false },
         { isDivider: true, text: '--- 进入 翻前 ---', cards: [] },
         { player: 'imafish', action: 'Fold', pot: 3, isHero: false },
         { player: 'Nikola..', action: 'Fold', pot: 3, isHero: false },
         { player: 'rd8121', action: 'Call 2', pot: 5, isHero: false },
         { player: 'Godz1lla', action: 'Fold', pot: 5, isHero: false },
         { player: 'Lucife..', action: 'Raise to 8', pot: 12, isHero: true },
         { player: 'moq66', action: 'Fold', pot: 12, isHero: false },
         { player: 'rd8121', action: 'Call 6', pot: 18, isHero: false }, 
         { isDivider: true, text: '--- 进入 Flop ---', cards: [{rank:'9',suit:'d'}, {rank:'5',suit:'c'}, {rank:'7',suit:'s'}] },
         { player: 'Lucife..', action: 'Check', pot: 18, isHero: true },
         { player: 'rd8121', action: 'Raise to 9', pot: 27, isHero: false },
         { player: 'Lucife..', action: 'Raise to 27', pot: 45, isHero: true },
         { player: 'rd8121', action: 'Call 18', pot: 72, isHero: false }, 
         { isDivider: true, text: '--- 进入 Turn ---', cards: [{rank:'8',suit:'h'}] },
         { player: 'Lucife..', action: 'Raise to 36', pot: 108, isHero: true },
         { player: 'rd8121', action: 'Fold', pot: 108, isHero: false },
         { isDivider: true, text: '--- 结算 ---', cards: [] },
         { player: '👑', action: 'Lucife.. 获胜 $72', isWinLog: true }
      ]);
      setIsViewingSave(true);
      setStage('summary');
    };

    return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-slate-900 text-white select-none">
      <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
        <h1 className="text-5xl font-extrabold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 pb-1">Poker+</h1>
        <p className="text-slate-400 mb-12 tracking-widest text-sm text-center">专业错题本 • 真德扑状态机复盘</p>
        <button onClick={() => {
            setHeroCards([null, null]);
            setPlayers([]);
            setCommunityCards([]);
            setTempCards([]);
            setHistory([]);
            setHistorySnapshots([]);
            setWinners([]);
            setStage('setup');
        }} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-500/50 active:scale-95 transition-transform mb-4">
          <Play size={20} className="fill-current" /><span>新建复盘牌局</span>
        </button>
        <button onClick={loadTestCase} className="text-xs text-slate-400 underline underline-offset-4 hover:text-slate-300">
          加载测试用例 (还原截图样式)
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
  };

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
    const [showRaiseDrawer, setShowRaiseDrawer] = useState(false);

    const onDragEnd = (_, { offset }) => {
      if (offset.x < -60) handleAction('Fold');
      else if (offset.x > 60) handleAction('Check/Call');
    };

    const handleCustomRaise = () => {
      const amt = prompt(`当前单次最高下注额为 ${highestBet}。\n在此基础上，你要加注到多少？(To)`);
      if (amt) handleAction('Raise', amt);
      setShowRaiseDrawer(false);
    };

    const handleRaiseClick = (amt) => {
      handleAction('Raise', amt);
      setShowRaiseDrawer(false);
    };

    const handleAllIn = () => {
      const amt = prompt(`请输入玩家 All-in 的总下注额 (当前面临最高下注是 ${highestBet}):`);
      if (amt) handleAction('All-in', amt);
      setShowRaiseDrawer(false);
    };

    const baseBet = highestBet > 0 ? highestBet : bbAmount;
    const callAmount = highestBet > player.betThisRound ? highestBet - player.betThisRound : 0;
    const potRaise = highestBet + (potSize + callAmount);

    return (
      <div className="flex flex-col items-center w-full h-[320px] justify-center relative mt-4">
        <AnimatePresence mode="popLayout">
          <motion.div key={`${player.id}-${history.length}`} drag="x" dragSnapToOrigin={true} dragElastic={0.4} onDragEnd={onDragEnd}
            initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -30 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_15px_50px_rgb(0,0,0,0.15)] border border-slate-100 p-8 flex flex-col items-center absolute z-20"
          >
            {showRaiseDrawer && (
              <div className="absolute inset-0 bg-white z-30 rounded-[2.5rem] flex flex-col p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-extrabold text-slate-800 text-lg">选择加注量</h4>
                  <button onClick={() => setShowRaiseDrawer(false)} className="text-slate-400 font-bold text-sm bg-slate-100 px-3 py-1 rounded-full">返回</button>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                  <button onClick={() => handleRaiseClick(baseBet * 2)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">2x ({baseBet * 2})</button>
                  <button onClick={() => handleRaiseClick(baseBet * 2.5)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">2.5x ({baseBet * 2.5})</button>
                  <button onClick={() => handleRaiseClick(baseBet * 3)} className="bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl active:bg-slate-100 shadow-sm transition-transform active:scale-95">3x ({baseBet * 3})</button>
                  <button onClick={() => handleRaiseClick(potRaise)} className="bg-blue-50 border-2 border-blue-200 text-blue-700 font-black py-4 rounded-2xl active:bg-blue-100 shadow-sm transition-transform active:scale-95">满Pot ({potRaise})</button>
                  <button onClick={handleAllIn} className="bg-red-50 text-red-600 border-2 border-red-200 font-black py-4 rounded-2xl active:bg-red-100 shadow-sm transition-transform active:scale-95">All-in (全下)</button>
                  <button onClick={handleCustomRaise} className="bg-slate-800 text-white font-bold py-4 rounded-2xl active:bg-slate-700 shadow-md transition-transform active:scale-95">自定义</button>
                </div>
              </div>
            )}

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
              <button onClick={() => setShowRaiseDrawer(true)} className="bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs shadow-md active:bg-slate-700">Raise</button>
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

  const renderSummary = () => {
    let rollingPot = 0;
    const streets = [];
    let currentStreet = null;

    history.forEach(h => {
      if (h.isDivider) {
        if (!h.text.includes('结算')) {
          if (currentStreet) streets.push(currentStreet);
          let nName = '翻牌前';
          if (h.text.includes('Flop')) nName = '翻牌';
          if (h.text.includes('Turn')) nName = '转牌';
          if (h.text.includes('River')) nName = '河牌';
          currentStreet = { name: nName, startPot: rollingPot, actions: [], cards: h.cards || [] };
        } else {
          if (currentStreet) streets.push(currentStreet);
          currentStreet = { name: '比牌', startPot: rollingPot, actions: [], cards: [] };
        }
      } else {
         if (!currentStreet) {
            currentStreet = { name: '盲注(前注)', startPot: 0, actions: [], cards: [] };
         }
         currentStreet.actions.push(h);
         if (!h.isWinLog && typeof h.pot === 'number') {
            rollingPot = h.pot;
         }
      }
    });
    if (currentStreet && (currentStreet.actions.length > 0 || currentStreet.name === '比牌')) {
       streets.push(currentStreet);
    }

    const parseAction = (actStr) => {
        let s = actStr.replace('Raise to', '加注 $').replace('Call', '跟注 $').replace('Check', '让牌').replace('Fold', '弃牌').replace('All-in', '全下 $');
        return s.split(' ');
    };

    return (
    <div className="flex flex-col min-h-screen bg-[#1e2024] text-white select-none">
      <div className="pt-6 mb-2 px-4 shadow-sm pb-2 z-10 z-20">
        <h2 className="text-2xl font-black text-amber-500 mb-1">手牌复盘</h2>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
            总底池: <span className="text-amber-400 ml-1 text-sm font-mono">${potSize}</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ touchAction: 'pan-x pan-y', cursor: 'grab' }}
        className="flex-1 overflow-x-auto overflow-y-hidden w-full no-scrollbar pb-[100px]"
      >
        <div className="flex min-w-max h-full border-t border-b border-[#303338] bg-[#2b2d31]">
           {streets.map((street, idx) => (
             <div key={idx} className="w-[110px] flex flex-col border-r border-[#3a3d42] shrink-0">
                <div className="py-2 text-center bg-[#191b1e] border-b border-[#3a3d42] flex flex-col items-center justify-center min-h-[46px]">
                   <div className="text-[10px] text-[#8e949c] font-bold">{street.name}</div>
                   {street.startPot > 0 && <div className="text-amber-400 font-black text-[11px] leading-none mt-0.5">${street.startPot}</div>}
                </div>
                
                {street.cards && street.cards.length > 0 && (
                   <div className="flex justify-center items-center py-1.5 bg-[#222428] border-b border-[#3a3d42]/70 min-h-[36px]">
                     <div className="flex scale-[0.6] origin-center -m-4">{street.cards.map((c, j) => <span key={j}>{formatCard(c)}</span>)}</div>
                   </div>
                )}

                <div className="flex-1 px-1.5 py-3 overflow-y-auto space-y-4 no-scrollbar">
                   {street.actions.map((act, j) => {
                     if (act.isWinLog) {
                        return (
                          <div key={j} className="bg-[#f5c64b] rounded-lg p-2 text-center shadow-md text-black mt-2">
                             <div className="font-extrabold text-[10px] leading-snug">{act.action}</div>
                          </div>
                        )
                     }
                     const pActionArray = parseAction(act.action);
                     const isHeroAction = act.isHero === true || (act.isHero !== false && players.some(p => p.name === act.player && p.isHero));
                     
                     if (isHeroAction) {
                        return (
                          <div key={j} className="flex w-full justify-end items-start gap-1.5 pl-2 group transition-opacity">
                             <div className="relative bg-[#f5c64b] text-black px-1.5 py-1 rounded shadow-md border border-[#dbb142] flex flex-col items-center justify-center min-w-[36px] text-center z-10">
                                {pActionArray.map((p, i)=><div key={i} className="text-[9px] font-extrabold leading-tight">{p}</div>)}
                                <div className="absolute top-2 -right-[4px] border-t-[4px] border-t-transparent border-l-[4px] border-l-[#f5c64b] border-b-[4px] border-b-transparent"></div>
                                <div className="absolute top-2 -right-[5px] border-t-[4px] border-t-transparent border-l-[4px] border-l-[#dbb142] border-b-[4px] border-b-transparent -z-10"></div>
                             </div>
                             <div className="flex flex-col items-center shrink-0 w-8">
                                <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-amber-500 overflow-hidden flex items-center justify-center text-xs shadow-sm">👑</div>
                                <div className="bg-[#141517] text-amber-500/90 text-[7px] px-1 rounded-sm -mt-2 z-10 border border-amber-600/50 font-bold max-w-full truncate">Hero</div>
                             </div>
                          </div>
                        )
                     } else {
                        return (
                          <div key={j} className="flex w-full justify-start items-start gap-1.5 pr-2 group transition-opacity">
                             <div className="flex flex-col items-center shrink-0 w-8">
                                <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-500 overflow-hidden flex items-center justify-center text-[9px] text-slate-200 font-black shadow-sm uppercase tracking-tighter">
                                   {act.player.substring(0,3)}
                                </div>
                                <div className="bg-[#141517] text-slate-300 text-[7px] px-1 rounded-sm -mt-2 z-10 border border-slate-600 font-bold max-w-full truncate">{act.player}</div>
                             </div>
                             <div className="relative bg-white text-slate-900 px-1.5 py-1 rounded shadow-md border border-slate-200 flex flex-col items-center justify-center min-w-[36px] text-center z-10">
                                <div className="absolute top-2 -left-[4px] border-t-[4px] border-t-transparent border-r-[4px] border-r-white border-b-[4px] border-b-transparent"></div>
                                <div className="absolute top-2 -left-[5px] border-t-[4px] border-t-transparent border-r-[4px] border-r-slate-200 border-b-[4px] border-b-transparent -z-10"></div>
                                {pActionArray.map((p, i)=><div key={i} className="text-[9px] font-extrabold leading-tight">{p}</div>)}
                             </div>
                          </div>
                        )
                     }
                   })}
                </div>
             </div>
           ))}
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#1e2024]/90 backdrop-blur-md p-4 border-t border-[#303338] z-30">
        {isViewingSave ? (
          <button onClick={() => setStage('home')} className="w-full bg-[#3a3d42] hover:bg-[#4a4d52] active:scale-95 transition-transform text-white py-4 rounded-2xl font-bold text-sm shadow-xl border border-[#4a4d52]">
            返回首页
          </button>
        ) : (
          <button onClick={saveCurrentGame} className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-transform text-white py-4 rounded-2xl font-black text-sm shadow-[0_10px_30px_rgb(5,150,105,0.4)] border border-emerald-400">
            保存对局并返回首页
          </button>
        )}
      </div>
    </div>
  )};

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