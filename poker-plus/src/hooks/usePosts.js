import { useState, useEffect, useCallback } from 'react';
import { MOCK_MODE, supabase } from '../lib/supabase';

// ── Mock 数据 ─────────────────────────────────────────────────
const MOCK_POSTS = [
  {
    id: '1', user_id: 'u1', type: 'discussion',
    title: 'AKo 在 BTN 面对 CO 开池，3bet 还是跟注？',
    body: '刚打了一手牌有点纠结。CO 2.5x 开池，我在 BTN 拿到 AKo，stack 深度 100BB。这个点位按 GTO 应该怎么处理？我觉得 3bet 比较多，但朋友说跟注更好保护 range。大家怎么看？',
    tags: ['GTO', '翻前策略', 'BTN'],
    like_count: 34, comment_count: 12,
    created_at: new Date(Date.now() - 1.2e6).toISOString(),
    profile: { nickname: 'River_2847', avatar_url: null },
  },
  {
    id: '2', user_id: 'u2', type: 'replay',
    title: '一手经典慢玩翻船的复盘',
    body: '翻牌拿到葫芦，决定慢玩，结果对手在河牌打了大注，我的 check-raise 被直接弃牌……',
    tags: ['复盘', '慢玩', '葫芦'],
    like_count: 18, comment_count: 5,
    created_at: new Date(Date.now() - 3.6e6).toISOString(),
    profile: { nickname: 'Bluff_4421', avatar_url: null },
    replay_data: {
      heroCards:  [{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }],
      boardCards: [{ rank: 'A', suit: 'd' }, { rank: 'A', suit: 'c' }, { rank: '7', suit: 'h' }, { rank: '2', suit: 's' }, { rank: 'K', suit: 'd' }],
      position: 'BTN', effectiveStack: 120, potSize: 8.5,
      result: '-14bb',
      actions: [
        { street: '翻牌', desc: 'Check → Check' },
        { street: '转牌', desc: 'Check → Bet 6bb → Call' },
        { street: '河牌', desc: 'Check → Bet 24bb → Raise 72bb → Fold' },
      ],
      streets: [
        { name: '翻牌前', startPot: 0, boardCards: [], actions: [
          { player: 'Player2', isHero: false, action: 'Raise to 6' },
          { player: 'Hero',    isHero: true,  action: 'Call 6' },
        ]},
        { name: '翻牌', startPot: 13, boardCards: [{ rank: 'A', suit: 'd' }, { rank: 'A', suit: 'c' }, { rank: '7', suit: 'h' }], actions: [
          { player: 'Hero',    isHero: true,  action: 'Check' },
          { player: 'Player2', isHero: false, action: 'Check' },
        ]},
        { name: '转牌', startPot: 13, boardCards: [{ rank: 'A', suit: 'd' }, { rank: 'A', suit: 'c' }, { rank: '7', suit: 'h' }, { rank: '2', suit: 's' }], actions: [
          { player: 'Hero',    isHero: true,  action: 'Check' },
          { player: 'Player2', isHero: false, action: 'Bet 6' },
          { player: 'Hero',    isHero: true,  action: 'Call 6' },
        ]},
        { name: '河牌', startPot: 25, boardCards: [{ rank: 'A', suit: 'd' }, { rank: 'A', suit: 'c' }, { rank: '7', suit: 'h' }, { rank: '2', suit: 's' }, { rank: 'K', suit: 'd' }], actions: [
          { player: 'Hero',    isHero: true,  action: 'Check' },
          { player: 'Player2', isHero: false, action: 'Bet 24' },
          { player: 'Hero',    isHero: true,  action: 'Raise to 72' },
          { player: 'Player2', isHero: false, action: 'Fold' },
        ]},
      ],
      savedGame: {
        sbAmount: 1, bbAmount: 2, heroIndex: 0, potSize: 97,
        heroCards: [{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }],
        communityCards: [{ rank: 'A', suit: 'd' }, { rank: 'A', suit: 'c' }, { rank: '7', suit: 'h' }, { rank: '2', suit: 's' }, { rank: 'K', suit: 'd' }],
        playerNames: { 0: 'Hero', 1: 'Player2' },
        playerStacks: { 0: 240, 1: 240 },
        players: [
          { id: 0, name: 'Hero',    isHero: true,  stackSize: 240, knownCards: [] },
          { id: 1, name: 'Player2', isHero: false, stackSize: 240, knownCards: [] },
        ],
        history: [
          { player: 'Player2', isHero: false, action: 'Raise to 6',  round: '翻前 (Pre-flop)', pot: 7  },
          { player: 'Hero',    isHero: true,  action: 'Call 6',      round: '翻前 (Pre-flop)', pot: 13 },
          { isDivider: true,   text: '--- 进入 翻牌 (Flop) ---',     cards: [{ rank: 'A', suit: 'd' }, { rank: 'A', suit: 'c' }, { rank: '7', suit: 'h' }] },
          { player: 'Hero',    isHero: true,  action: 'Check',       round: '翻牌 (Flop)',     pot: 13 },
          { player: 'Player2', isHero: false, action: 'Check',       round: '翻牌 (Flop)',     pot: 13 },
          { isDivider: true,   text: '--- 进入 转牌 (Turn) ---',     cards: [{ rank: '2', suit: 's' }] },
          { player: 'Hero',    isHero: true,  action: 'Check',       round: '转牌 (Turn)',     pot: 13 },
          { player: 'Player2', isHero: false, action: 'Bet 6',       round: '转牌 (Turn)',     pot: 19 },
          { player: 'Hero',    isHero: true,  action: 'Call 6',      round: '转牌 (Turn)',     pot: 25 },
          { isDivider: true,   text: '--- 进入 河牌 (River) ---',    cards: [{ rank: 'K', suit: 'd' }] },
          { player: 'Hero',    isHero: true,  action: 'Check',       round: '河牌 (River)',    pot: 25 },
          { player: 'Player2', isHero: false, action: 'Bet 24',      round: '河牌 (River)',    pot: 49 },
          { player: 'Hero',    isHero: true,  action: 'Raise to 72', round: '河牌 (River)',    pot: 97 },
          { player: 'Player2', isHero: false, action: 'Fold',        round: '河牌 (River)',    pot: 97 },
          { isDivider: true,   text: '--- 结算 ---', cards: [] },
          { isWinLog: true,    action: 'Hero 赢下底池 $97',           pot: 97 },
        ],
      },
    },
  },
  {
    id: '3', user_id: 'u3', type: 'discussion',
    title: '如何应对频繁 donk bet 的玩家？',
    body: '最近遇到一个玩家，翻牌后经常 donk bet，不管是否中牌。我发现自己的应对策略比较混乱，raise 了几次都被跟到底，fold 又感觉被利用。有没有系统性的应对思路？',
    tags: ['donk bet', '策略', '现金局'],
    like_count: 27, comment_count: 9,
    created_at: new Date(Date.now() - 7.2e6).toISOString(),
    profile: { nickname: 'Equity_9183', avatar_url: null },
  },
  {
    id: '4', user_id: 'u4', type: 'replay',
    title: '河牌 bluff catch 的决策分析',
    body: '对手在河牌对一个非常 dry 的牌面打了 2/3 pot，我手上只有 2nd pair。最后决定跟注——复盘来看这个决策正确吗？',
    tags: ['bluff catch', '河牌', '复盘'],
    like_count: 41, comment_count: 16,
    created_at: new Date(Date.now() - 14.4e6).toISOString(),
    profile: { nickname: 'GTO_Player', avatar_url: null },
    replay_data: {
      heroCards:  [{ rank: 'T', suit: 'h' }, { rank: '9', suit: 'd' }],
      boardCards: [{ rank: 'J', suit: 's' }, { rank: '5', suit: 'c' }, { rank: '2', suit: 'h' }, { rank: '3', suit: 'd' }, { rank: '8', suit: 's' }],
      position: 'BB', effectiveStack: 85, potSize: 18,
      result: '+27bb',
      actions: [
        { street: '翻牌', desc: 'Check → Bet 10bb → Call' },
        { street: '转牌', desc: 'Check → Check' },
        { street: '河牌', desc: 'Check → Bet 27bb → Call' },
      ],
      streets: [
        { name: '翻牌前', startPot: 0, boardCards: [], actions: [
          { player: 'Player2', isHero: false, action: 'Raise to 5' },
          { player: 'Hero',    isHero: true,  action: 'Call 5' },
        ]},
        { name: '翻牌', startPot: 11, boardCards: [{ rank: 'J', suit: 's' }, { rank: '5', suit: 'c' }, { rank: '2', suit: 'h' }], actions: [
          { player: 'Hero',    isHero: true,  action: 'Check' },
          { player: 'Player2', isHero: false, action: 'Bet 10' },
          { player: 'Hero',    isHero: true,  action: 'Call 10' },
        ]},
        { name: '转牌', startPot: 31, boardCards: [{ rank: 'J', suit: 's' }, { rank: '5', suit: 'c' }, { rank: '2', suit: 'h' }, { rank: '3', suit: 'd' }], actions: [
          { player: 'Hero',    isHero: true,  action: 'Check' },
          { player: 'Player2', isHero: false, action: 'Check' },
        ]},
        { name: '河牌', startPot: 31, boardCards: [{ rank: 'J', suit: 's' }, { rank: '5', suit: 'c' }, { rank: '2', suit: 'h' }, { rank: '3', suit: 'd' }, { rank: '8', suit: 's' }], actions: [
          { player: 'Hero',    isHero: true,  action: 'Check' },
          { player: 'Player2', isHero: false, action: 'Bet 27' },
          { player: 'Hero',    isHero: true,  action: 'Call 27' },
        ]},
      ],
      savedGame: {
        sbAmount: 1, bbAmount: 2, heroIndex: 0, potSize: 85,
        heroCards: [{ rank: 'T', suit: 'h' }, { rank: '9', suit: 'd' }],
        communityCards: [{ rank: 'J', suit: 's' }, { rank: '5', suit: 'c' }, { rank: '2', suit: 'h' }, { rank: '3', suit: 'd' }, { rank: '8', suit: 's' }],
        playerNames: { 0: 'Hero', 1: 'Player2' },
        playerStacks: { 0: 170, 1: 170 },
        players: [
          { id: 0, name: 'Hero',    isHero: true,  stackSize: 170, knownCards: [] },
          { id: 1, name: 'Player2', isHero: false, stackSize: 170, knownCards: [] },
        ],
        history: [
          { player: 'Player2', isHero: false, action: 'Raise to 5',  round: '翻前 (Pre-flop)', pot: 6  },
          { player: 'Hero',    isHero: true,  action: 'Call 5',      round: '翻前 (Pre-flop)', pot: 11 },
          { isDivider: true,   text: '--- 进入 翻牌 (Flop) ---',     cards: [{ rank: 'J', suit: 's' }, { rank: '5', suit: 'c' }, { rank: '2', suit: 'h' }] },
          { player: 'Hero',    isHero: true,  action: 'Check',       round: '翻牌 (Flop)',     pot: 11 },
          { player: 'Player2', isHero: false, action: 'Bet 10',      round: '翻牌 (Flop)',     pot: 21 },
          { player: 'Hero',    isHero: true,  action: 'Call 10',     round: '翻牌 (Flop)',     pot: 31 },
          { isDivider: true,   text: '--- 进入 转牌 (Turn) ---',     cards: [{ rank: '3', suit: 'd' }] },
          { player: 'Hero',    isHero: true,  action: 'Check',       round: '转牌 (Turn)',     pot: 31 },
          { player: 'Player2', isHero: false, action: 'Check',       round: '转牌 (Turn)',     pot: 31 },
          { isDivider: true,   text: '--- 进入 河牌 (River) ---',    cards: [{ rank: '8', suit: 's' }] },
          { player: 'Hero',    isHero: true,  action: 'Check',       round: '河牌 (River)',    pot: 31 },
          { player: 'Player2', isHero: false, action: 'Bet 27',      round: '河牌 (River)',    pot: 58 },
          { player: 'Hero',    isHero: true,  action: 'Call 27',     round: '河牌 (River)',    pot: 85 },
          { isDivider: true,   text: '--- 结算 ---', cards: [] },
          { isWinLog: true,    action: 'Hero 赢下底池 $85',           pot: 85 },
        ],
      },
    },
  },
  {
    id: '5', user_id: 'u5', type: 'discussion',
    title: '初学者必读：Equity 和 EV 的区别是什么？',
    body: '整理了一篇关于 Equity 和 EV 概念的入门说明，供新手参考。Equity 是指你在这手牌中赢得底池的概率，而 EV（期望值）是考虑了对手 range 后你的长期期望收益……',
    tags: ['入门', 'Equity', 'EV', '教学'],
    like_count: 89, comment_count: 23,
    created_at: new Date(Date.now() - 86.4e6).toISOString(),
    profile: { nickname: 'Button_4416', avatar_url: null },
  },
];

const PAGE_SIZE = 20;

/**
 * Feed 数据获取，支持 type 过滤 + cursor-based 无限滚动
 */
export function usePosts(typeFilter = 'all') {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor]   = useState(null); // last post created_at

  const load = useCallback(async () => {
    setLoading(true);
    setCursor(null);

    if (MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400));
      const filtered = typeFilter === 'all'
        ? MOCK_POSTS
        : MOCK_POSTS.filter(p => p.type === typeFilter);
      setPosts(filtered);
      setHasMore(false);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('posts')
        .select('*, profile:profiles(nickname, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (typeFilter !== 'all') query = query.eq('type', typeFilter);

      const { data } = await query;
      const list = data || [];
      setPosts(list);
      setHasMore(list.length === PAGE_SIZE);
      if (list.length > 0) setCursor(list[list.length - 1].created_at);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor || MOCK_MODE) return;
    setLoadingMore(true);

    try {
      let query = supabase
        .from('posts')
        .select('*, profile:profiles(nickname, avatar_url)')
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (typeFilter !== 'all') query = query.eq('type', typeFilter);

      const { data } = await query;
      const list = data || [];
      setPosts(prev => [...prev, ...list]);
      setHasMore(list.length === PAGE_SIZE);
      if (list.length > 0) setCursor(list[list.length - 1].created_at);
    } catch {
      // keep existing posts
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, cursor, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return { posts, loading, loadingMore, hasMore, loadMore, refresh: load };
}

export { MOCK_POSTS };
