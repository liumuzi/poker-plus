import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { MOCK_POSTS } from '../../hooks/usePosts';
import { MOCK_MODE, supabase } from '../../lib/supabase';
import PostCard from '../../components/community/PostCard';

const TYPE_TABS = [
  { id: 'all',        label: '全部' },
  { id: 'replay',     label: '复盘' },
  { id: 'discussion', label: '讨论' },
];

function searchMockPosts(query, typeFilter) {
  const q = query.trim().toLowerCase();
  return MOCK_POSTS.filter(p => {
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    if (!q) return matchType;
    const inTitle = p.title.toLowerCase().includes(q);
    const inBody  = p.body.toLowerCase().includes(q);
    const inTags  = p.tags?.some(t => t.toLowerCase().includes(q));
    return matchType && (inTitle || inBody || inTags);
  });
}

export default function SearchPage({ onBack, onNavigate }) {
  const [query, setQuery]   = useState('');
  const [tab, setTab]       = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }

    setLoading(true);
    setSearched(true);

    if (MOCK_MODE) {
      const timer = setTimeout(() => {
        setResults(searchMockPosts(query, tab));
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    // 真实 Supabase 搜索
    (async () => {
      let q = supabase
        .from('posts')
        .select('*, profile:profiles(nickname, avatar_url)')
        .eq('is_hidden', false)
        .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (tab !== 'all') q = q.eq('type', tab);
      const { data } = await q;
      setResults(data || []);
      setLoading(false);
    })();
  }, [query, tab]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-12 pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
        >
          <ArrowLeft size={20} color="#9CA3AF" />
        </button>

        <div className="flex-1 flex items-center bg-gray-800 rounded-full px-4 h-10">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索帖子、标签..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')} className="ml-2">
              <X size={15} color="#6B7280" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {TYPE_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <main className="flex flex-col gap-3 px-4">
        {!searched ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-sm">输入关键词开始搜索</p>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">没有找到「{query}」相关的帖子</p>
          </div>
        ) : (
          results.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => onNavigate({ screen: 'post', params: { postId: post.id } })}
              onAvatarClick={() => onNavigate({ screen: 'userProfile', params: { userId: post.user_id } })}
            />
          ))
        )}
      </main>
    </div>
  );
}
