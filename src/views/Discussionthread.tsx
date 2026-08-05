import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, Trash2, CornerDownRight, X } from 'lucide-react';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Authorization': `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' };
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DiscussionThread({ route, navigate, profile, showToast }: any) {
  const idMatch = route.match(/\/discussion\/(.+)/);
  const groupId = idMatch ? idMatch[1] : null;

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { if (groupId) fetchPosts(); }, [groupId]);

  async function fetchPosts() {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/discussion-groups/${groupId}/posts`, { headers });
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }

  async function handleSend() {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/discussion-groups/${groupId}/posts`, {
        method: 'POST', headers,
        body: JSON.stringify({ content: newMessage.trim(), parentPostId: replyingTo?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post');
      setPosts(prev => [...prev, data.post]);
      setNewMessage('');
      setReplyingTo(null);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to post');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Delete this post?')) return;
    const headers = await getAuthHeader();
    await fetch(`/api/discussion-posts/${postId}`, { method: 'DELETE', headers });
    setPosts(prev => prev.filter(p => p.id !== postId && p.parent_post_id !== postId));
  }

  const topLevel = posts.filter(p => !p.parent_post_id);
  const repliesFor = (postId: string) => posts.filter(p => p.parent_post_id === postId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] min-h-screen text-[var(--text-primary)] font-body flex flex-col">
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--border)] px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/discussions')} className="p-2 hover:bg-black/5 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="font-bold text-lg">Discussion</div>
      </div>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full pb-32">
        {topLevel.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-16">
            No posts yet. Start the conversation!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {topLevel.map(post => (
              <div key={post.id} className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                <PostRow post={post} profile={profile} onDelete={handleDelete} onReply={() => setReplyingTo({ id: post.id, authorName: post.author?.name ?? 'them' })} />

                {repliesFor(post.id).length > 0 && (
                  <div className="mt-3 ml-6 pl-3 border-l-2 border-[var(--border)] flex flex-col gap-3">
                    {repliesFor(post.id).map(reply => (
                      <PostRow key={reply.id} post={reply} profile={profile} onDelete={handleDelete} compact />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border)] p-4">
        <div className="max-w-2xl mx-auto">
          {replyingTo && (
            <div className="flex items-center justify-between bg-[var(--surface-light)] px-3 py-1.5 rounded-lg mb-2 text-xs">
              <span className="text-[var(--text-muted)]">Replying to <strong>{replyingTo.authorName}</strong></span>
              <button onClick={() => setReplyingTo(null)} className="text-[var(--text-muted)]"><X size={14} /></button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={replyingTo ? 'Write a reply...' : 'Start a discussion...'}
              className="flex-1 bg-[var(--surface-light)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="w-11 h-11 rounded-full bg-[var(--primary)] flex items-center justify-center disabled:opacity-40 shrink-0"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PostRow({ post, profile, onDelete, onReply, compact }: any) {
  const isMe = post.author_id === profile?.id;
  return (
    <div className={compact ? '' : ''}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`rounded-full bg-[var(--accent-warm)] flex items-center justify-center text-white font-bold shrink-0 ${compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'}`}>
          {post.author?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`}>{post.author?.name ?? 'Student'}</div>
          <div className="text-[10px] text-[var(--text-muted)]">{timeAgo(post.created_at)}</div>
        </div>
        {isMe && (
          <button onClick={() => onDelete(post.id)} className="p-1 hover:bg-red-50 rounded text-red-400 shrink-0">
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <p className={`leading-relaxed whitespace-pre-wrap ${compact ? 'text-xs' : 'text-sm'}`}>{post.content}</p>
      {onReply && (
        <button onClick={onReply} className="flex items-center gap-1 text-xs text-[var(--primary)] font-semibold mt-2">
          <CornerDownRight size={12} /> Reply
        </button>
      )}
    </div>
  );
}
