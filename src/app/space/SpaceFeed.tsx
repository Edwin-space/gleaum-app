'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useSpacePosts } from '@/hooks/useSpacePosts';
import { getPostComments, addComment, deleteComment, toggleDuesPayment, castVote } from '@/lib/db';
import { formatAmount } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { sendSpaceNotification } from '@/lib/spaceNotify';
import type { SpacePost, SpacePostComment, SpaceMember, User, SpaceRole } from '@/types';

// ── 상수 ─────────────────────────────────────────────────────
const POST_TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  general:  { label: '일반',  emoji: '💬', color: '#1A1B2E', bg: 'rgba(26,27,46,0.07)' },
  schedule: { label: '일정',  emoji: '📅', color: '#0084CC', bg: 'rgba(0,132,204,0.08)' },
  dues:     { label: '회비',  emoji: '💰', color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  vote:     { label: '투표',  emoji: '🗳️', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  notice:   { label: '공지',  emoji: '📢', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)  return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)   return `${diffD}일 전`;
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}월 ${d}일`;
}

// ── Props ─────────────────────────────────────────────────────
interface SpaceFeedProps {
  spaceId: string | null;
  spaceName?: string;
  members: SpaceMember[];
  currentUser: User | null;
  currentUserRole: SpaceRole | null;
}

// ── 게시물 생성 모달 ──────────────────────────────────────────
interface CreatePostModalProps {
  onClose: () => void;
  onCreate: (input: Parameters<ReturnType<typeof useSpacePosts>['create']>[0]) => Promise<SpacePost | null>;
}

function CreatePostModal({ onClose, onCreate }: CreatePostModalProps) {
  const [type, setType]       = useState<'general' | 'schedule' | 'dues' | 'vote' | 'notice'>('general');
  const [content, setContent] = useState('');
  const [pinned, setPinned]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 회비 전용
  const [dueTotal, setDueTotal]   = useState('');
  const [duePerPerson, setDuePerPerson] = useState('');
  const [dueDate, setDueDate]     = useState('');

  // 투표 전용
  const [voteTitle, setVoteTitle]   = useState('');
  const [voteOptions, setVoteOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [voteEndsAt, setVoteEndsAt] = useState('');

  const handleSubmit = async () => {
    if (submitting) return;
    if (type === 'vote' && (!voteTitle.trim() || voteOptions.filter(o => o.trim()).length < 2)) {
      toast.error('투표 제목과 선택지를 2개 이상 입력하세요');
      return;
    }
    if (type === 'dues' && !dueTotal.trim()) {
      toast.error('회비 총액을 입력하세요');
      return;
    }
    if (type !== 'vote' && type !== 'dues' && !content.trim()) {
      toast.error('내용을 입력하세요');
      return;
    }

    setSubmitting(true);
    const input: Parameters<typeof onCreate>[0] = {
      type,
      content: content.trim() || undefined,
      pinned: type === 'notice' ? true : pinned,
    };

    if (type === 'dues') {
      input.dues = {
        totalAmount: parseInt(dueTotal.replace(/,/g, ''), 10) || 0,
        perPerson: duePerPerson ? parseInt(duePerPerson.replace(/,/g, ''), 10) : undefined,
        dueDate: dueDate || undefined,
      };
    }

    if (type === 'vote') {
      input.vote = {
        title: voteTitle.trim(),
        multipleChoice,
        endsAt: voteEndsAt || undefined,
        options: voteOptions.filter(o => o.trim()),
      };
    }

    const result = await onCreate(input);
    setSubmitting(false);
    if (result) {
      toast.success('게시물이 등록되었습니다');
      onClose();
    } else {
      toast.error('게시물 등록에 실패했습니다');
    }
  };

  const typeButtons = [
    { key: 'general',  label: '일반',  emoji: '💬' },
    { key: 'schedule', label: '일정',  emoji: '📅' },
    { key: 'dues',     label: '회비',  emoji: '💰' },
    { key: 'vote',     label: '투표',  emoji: '🗳️' },
    { key: 'notice',   label: '공지',  emoji: '📢' },
  ] as const;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--theme-surface)', borderRadius: '28px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.20)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--theme-text)', margin: '0 0 20px' }}>새 게시물</h3>

        {/* 유형 탭 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {typeButtons.map(t => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              style={{
                padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 800,
                background: type === t.key ? POST_TYPE_CONFIG[t.key].bg : 'var(--theme-surface-muted)',
                color: type === t.key ? POST_TYPE_CONFIG[t.key].color : 'var(--theme-text-subtle)',
                border: type === t.key ? `1.5px solid ${POST_TYPE_CONFIG[t.key].color}40` : '1.5px solid transparent',
                cursor: 'pointer',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* 내용 */}
        {type !== 'vote' && (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              type === 'dues' ? '회비 관련 안내 (선택)' :
              type === 'notice' ? '공지 내용을 입력하세요...' :
              '무슨 이야기를 나눌까요?'
            }
            rows={4}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '16px', fontSize: '15px', fontWeight: 500,
              background: 'var(--theme-surface-muted)', border: '1.5px solid transparent',
              outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              color: 'var(--theme-text)', lineHeight: 1.6, marginBottom: '16px',
              fontFamily: 'inherit',
            }}
          />
        )}

        {/* 회비 전용 필드 */}
        {type === 'dues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>총액 *</label>
                <input
                  value={dueTotal}
                  onChange={e => setDueTotal(e.target.value)}
                  placeholder="예: 50000"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, background: 'var(--theme-surface-muted)', border: 'none', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>1인당 (선택)</label>
                <input
                  value={duePerPerson}
                  onChange={e => setDuePerPerson(e.target.value)}
                  placeholder="예: 10000"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, background: 'var(--theme-surface-muted)', border: 'none', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '6px' }}>납부 기한 (선택)</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, background: 'var(--theme-surface-muted)', border: 'none', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }}
              />
            </div>
          </div>
        )}

        {/* 투표 전용 필드 */}
        {type === 'vote' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <input
              value={voteTitle}
              onChange={e => setVoteTitle(e.target.value)}
              placeholder="투표 제목 *"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, background: 'var(--theme-surface-muted)', border: 'none', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {voteOptions.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={opt}
                    onChange={e => {
                      const next = [...voteOptions];
                      next[i] = e.target.value;
                      setVoteOptions(next);
                    }}
                    placeholder={`선택지 ${i + 1}`}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: 'none', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }}
                  />
                  {voteOptions.length > 2 && (
                    <button
                      onClick={() => setVoteOptions(prev => prev.filter((_, j) => j !== i))}
                      style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >✕</button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setVoteOptions(prev => [...prev, ''])}
                style={{ padding: '8px', borderRadius: '12px', background: 'rgba(0,132,204,0.06)', border: '1.5px dashed rgba(0,132,204,0.25)', color: '#0084CC', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                + 선택지 추가
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)', cursor: 'pointer' }}>
                <input type="checkbox" checked={multipleChoice} onChange={e => setMultipleChoice(e.target.checked)} />
                복수 선택 허용
              </label>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--theme-text-subtle)', display: 'block', marginBottom: '4px' }}>마감일 (선택)</label>
                <input
                  type="datetime-local"
                  value={voteEndsAt}
                  onChange={e => setVoteEndsAt(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', background: 'var(--theme-surface-muted)', border: 'none', outline: 'none', boxSizing: 'border-box', color: 'var(--theme-text)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 고정 옵션 (일반/일정만) */}
        {(type === 'general' || type === 'schedule') && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--theme-text-subtle)', cursor: 'pointer', marginBottom: '20px' }}>
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
            상단 고정
          </label>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: '48px', borderRadius: '14px', background: 'var(--theme-surface-muted)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: 'var(--theme-text-subtle)' }}
          >취소</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 2, height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #0CC9B5, #0084CC)', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 900, color: 'white', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? '등록 중...' : '게시하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 댓글 영역 ─────────────────────────────────────────────────
interface CommentsProps {
  postId: string;
  currentUserId: string;
  members: SpaceMember[];
  onRefreshPost: () => void;
}

function CommentSection({ postId, currentUserId, members, onRefreshPost }: CommentsProps) {
  const [comments, setComments] = useState<SpacePostComment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPostComments(postId);
    setComments(data);
    setLoading(false);
  }, [postId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const handleAdd = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const result = await addComment(postId, text.trim());
    setSubmitting(false);
    if (result) {
      setComments(prev => [...prev, result]);
      setText('');
      onRefreshPost();
    } else {
      toast.error('댓글 등록에 실패했습니다');
    }
  };

  const handleDelete = async (commentId: string) => {
    const ok = await deleteComment(commentId);
    if (ok) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      onRefreshPost();
    }
  };

  return (
    <div style={{ borderTop: '1px solid var(--theme-surface-muted)', paddingTop: '14px', marginTop: '12px' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
          {comments.map(c => {
            const commentAuthorMember = members.find(m => m.userId === c.authorId);
            const commentAuthorName = commentAuthorMember?.nickname ?? commentAuthorMember?.user?.name ?? c.author?.name ?? '멤버';
            const commentAuthorAvatar = commentAuthorMember?.user?.avatar ?? c.author?.avatar;
            return (
            <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <UserAvatar avatar={commentAuthorAvatar} name={commentAuthorName} size={28} radius={999} fontSize={12} />
              <div style={{ flex: 1, background: 'var(--theme-surface-muted)', borderRadius: '12px', padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--theme-text)' }}>{commentAuthorName}</span>
                  <span style={{ fontSize: '10px', color: 'var(--theme-text-subtle)', fontWeight: 600 }}>{formatRelativeTime(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--theme-text)', margin: '3px 0 0', lineHeight: 1.5 }}>{c.content}</p>
              </div>
              {c.authorId === currentUserId && (
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-subtle)', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >✕</button>
              )}
            </div>
            );
          })}
          {comments.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--theme-text-subtle)', fontWeight: 600, textAlign: 'center', margin: 0 }}>첫 댓글을 남겨보세요 ✍️</p>
          )}
        </div>
      )}

      {/* 댓글 입력 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && void handleAdd()}
          placeholder="댓글 입력..."
          style={{ flex: 1, padding: '9px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, background: 'var(--theme-surface-muted)', border: 'none', outline: 'none', color: 'var(--theme-text)' }}
        />
        <button
          onClick={handleAdd}
          disabled={submitting || !text.trim()}
          style={{ padding: '9px 16px', borderRadius: '999px', background: text.trim() ? '#0084CC' : 'var(--theme-surface-muted)', border: 'none', cursor: text.trim() ? 'pointer' : 'default', fontSize: '12px', fontWeight: 800, color: text.trim() ? 'white' : 'var(--theme-text-subtle)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
        >
          {submitting ? '...' : '전송'}
        </button>
      </div>
    </div>
  );
}

// ── 게시물 카드 ───────────────────────────────────────────────
interface PostCardProps {
  post: SpacePost;
  currentUserId: string;
  currentUserRole: SpaceRole | null;
  members: SpaceMember[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

function PostCard({ post, currentUserId, currentUserRole, members, onDelete, onRefresh }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [localVoters, setLocalVoters]   = useState<Record<string, string[]>>(
    () => {
      const map: Record<string, string[]> = {};
      post.vote?.options?.forEach(o => { map[o.id] = o.voters ?? []; });
      return map;
    }
  );
  const [voteLoading, setVoteLoading] = useState<Record<string, boolean>>({});
  const [duesPaid, setDuesPaid]       = useState<boolean>(
    post.dues?.payments?.some(p => p.userId === currentUserId && p.paid) ?? false
  );
  const [duesLoading, setDuesLoading] = useState(false);

  const cfg = POST_TYPE_CONFIG[post.type] ?? POST_TYPE_CONFIG.general;
  const isAuthor = post.authorId === currentUserId;
  const isAdmin  = currentUserRole === 'admin';
  const canDelete = isAuthor || isAdmin;

  // members 배열에서 작성자 조회
  const authorMember = members.find(m => m.userId === post.authorId);
  const authorName = authorMember?.nickname ?? authorMember?.user?.name ?? post.author?.name ?? '멤버';
  const authorAvatar = authorMember?.user?.avatar ?? post.author?.avatar;

  const handleVote = async (optionId: string) => {
    const isSelected = localVoters[optionId]?.includes(currentUserId) ?? false;
    const vote = post.vote;
    if (!vote) return;

    // 단수 선택: 기존 선택 제거
    if (!vote.multipleChoice) {
      const prevSelected = Object.entries(localVoters).find(([, voters]) => voters.includes(currentUserId));
      if (prevSelected && prevSelected[0] !== optionId) {
        // 기존 선택 제거
        setLocalVoters(prev => ({ ...prev, [prevSelected[0]]: prev[prevSelected[0]].filter(uid => uid !== currentUserId) }));
        setVoteLoading(prev => ({ ...prev, [prevSelected[0]]: true }));
        await castVote(prevSelected[0], false);
        setVoteLoading(prev => ({ ...prev, [prevSelected[0]]: false }));
      }
    }

    setVoteLoading(prev => ({ ...prev, [optionId]: true }));
    const newSelected = !isSelected;
    setLocalVoters(prev => ({
      ...prev,
      [optionId]: newSelected
        ? [...(prev[optionId] ?? []), currentUserId]
        : (prev[optionId] ?? []).filter(uid => uid !== currentUserId),
    }));
    await castVote(optionId, newSelected);
    setVoteLoading(prev => ({ ...prev, [optionId]: false }));
  };

  const handleDuesToggle = async () => {
    if (!post.dues || duesLoading) return;
    setDuesLoading(true);
    const newPaid = !duesPaid;
    setDuesPaid(newPaid);
    await toggleDuesPayment(post.dues.id, newPaid);
    setDuesLoading(false);
    toast.success(newPaid ? '납부 완료로 표시했습니다' : '미납부로 변경했습니다');
  };

  const totalVotes = Object.values(localVoters).reduce((sum, voters) => sum + voters.length, 0);

  return (
    <div style={{
      background: post.pinned ? 'rgba(220,38,38,0.03)' : 'var(--theme-surface)',
      borderRadius: '20px', padding: '20px 20px 16px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      border: post.pinned ? '1.5px solid rgba(220,38,38,0.15)' : '1px solid rgba(0,0,0,0.04)',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserAvatar avatar={authorAvatar} name={authorName} size={36} radius={12} fontSize={16} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)' }}>{authorName}</span>
              <span style={{
                padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800,
                background: cfg.bg, color: cfg.color,
              }}>
                {cfg.emoji} {cfg.label}
              </span>
              {post.pinned && (
                <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 800, background: 'rgba(220,38,38,0.10)', color: '#DC2626' }}>
                  📌 고정
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--theme-text-subtle)', fontWeight: 600 }}>
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => { if (confirm('이 게시물을 삭제할까요?')) onDelete(post.id); }}
            style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.07)', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >✕</button>
        )}
      </div>

      {/* 내용 */}
      {post.content && (
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--theme-text)', margin: '0 0 12px', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.content}
        </p>
      )}

      {/* 회비 카드 */}
      {post.type === 'dues' && post.dues && (
        <div style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 800, color: '#D97706', margin: '0 0 2px' }}>💰 회비 요청</p>
              <p style={{ fontSize: '18px', fontWeight: 900, color: '#D97706', margin: 0, letterSpacing: '-0.3px' }}>
                {formatAmount(post.dues.totalAmount)}
              </p>
              {post.dues.perPerson && (
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: '2px 0 0' }}>
                  1인당 {formatAmount(post.dues.perPerson)}
                </p>
              )}
              {post.dues.dueDate && (
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: '2px 0 0' }}>
                  납부 기한: {post.dues.dueDate}
                </p>
              )}
            </div>
            <button
              onClick={handleDuesToggle}
              disabled={duesLoading}
              style={{
                padding: '8px 16px', borderRadius: '12px', border: 'none', cursor: duesLoading ? 'not-allowed' : 'pointer',
                background: duesPaid ? 'rgba(5,150,105,0.12)' : '#D97706',
                color: duesPaid ? '#059669' : 'white',
                fontSize: '12px', fontWeight: 800, opacity: duesLoading ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {duesPaid ? '✓ 납부 완료' : '납부 확인'}
            </button>
          </div>
          {/* 납부 현황 바 */}
          {post.dues.payments && post.dues.payments.length > 0 && (
            <div>
              <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(217,119,6,0.15)', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{
                  height: '100%', borderRadius: '999px', background: '#D97706',
                  width: `${Math.round((post.dues.payments.filter(p => p.paid).length / post.dues.payments.length) * 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--theme-text-subtle)', margin: 0 }}>
                {post.dues.payments.filter(p => p.paid).length}/{post.dues.payments.length}명 납부 완료
              </p>
            </div>
          )}
        </div>
      )}

      {/* 투표 카드 */}
      {post.type === 'vote' && post.vote && (
        <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: 900, color: '#7C3AED', margin: '0 0 12px' }}>
            🗳️ {post.vote.title}
            {post.vote.multipleChoice && <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--theme-text-subtle)' }}>(복수 선택)</span>}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {post.vote.options?.map(option => {
              const voters  = localVoters[option.id] ?? [];
              const isVoted = voters.includes(currentUserId);
              const count   = voters.length;
              const pct     = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  disabled={voteLoading[option.id]}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    width: '100%', padding: '10px 14px', borderRadius: '12px', textAlign: 'left',
                    background: isVoted ? 'rgba(124,58,237,0.10)' : 'var(--theme-surface)',
                    border: `1.5px solid ${isVoted ? 'rgba(124,58,237,0.35)' : 'rgba(0,0,0,0.08)'}`,
                    cursor: voteLoading[option.id] ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* 결과 바 */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: isVoted ? 'rgba(124,58,237,0.12)' : 'rgba(0,0,0,0.04)', transition: 'width 0.3s', zIndex: 0 }} />
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: isVoted ? 800 : 600, color: isVoted ? '#7C3AED' : 'var(--theme-text)' }}>
                      {isVoted ? '✓ ' : ''}{option.label}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: isVoted ? '#7C3AED' : 'var(--theme-text-subtle)' }}>
                      {count}표 ({pct}%)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: '8px 0 0' }}>
            총 {totalVotes}표
            {post.vote.endsAt && ` · 마감 ${formatRelativeTime(post.vote.endsAt)}`}
          </p>
        </div>
      )}

      {/* 하단 액션 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={() => setShowComments(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '999px', border: 'none', cursor: 'pointer',
            background: showComments ? 'rgba(0,132,204,0.08)' : 'var(--theme-surface-muted)',
            color: showComments ? '#0084CC' : 'var(--theme-text-subtle)',
            fontSize: '12px', fontWeight: 800,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          댓글 {(post.commentCount ?? 0) > 0 ? post.commentCount : ''}
        </button>
      </div>

      {/* 댓글 섹션 */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          members={members}
          onRefreshPost={onRefresh}
        />
      )}
    </div>
  );
}

// ── 메인 SpaceFeed 컴포넌트 ──────────────────────────────────
export function SpaceFeed({ spaceId, spaceName, members, currentUser, currentUserRole }: SpaceFeedProps) {
  const { posts, loading, refresh, create, remove } = useSpacePosts(spaceId);
  const [showCreate, setShowCreate] = useState(false);

  const currentUserId = currentUser?.id ?? '';

  const handleCreate = async (input: Parameters<typeof create>[0]) => {
    const result = await create(input);
    if (result && spaceId && spaceName) {
      // 공유 공간에서만 알림 전송
      void sendSpaceNotification({
        spaceId,
        spaceName,
        message: `새 게시물이 등록되었습니다. 확인해보세요.`,
        url: `/space`,
        excludeUserId: currentUserId,
      });
    }
    return result;
  };

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* 게시물 목록 */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid #0084CC', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text-subtle)' }}>피드 불러오는 중...</span>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
          <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 6px' }}>아직 게시물이 없어요</p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--theme-text-subtle)', margin: 0 }}>첫 번째 이야기를 시작해보세요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              members={members}
              onDelete={remove}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* ── 작성 버튼 (피드 하단) ── */}
      <button
        onClick={() => setShowCreate(true)}
        style={{
          width: '100%', padding: '16px 20px', borderRadius: '18px',
          marginTop: posts.length > 0 ? '16px' : '0',
          background: 'var(--theme-surface)', border: '1.5px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', gap: '12px',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <UserAvatar avatar={currentUser?.avatar} name={currentUser?.name} size={36} radius={12} fontSize={16} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--theme-text-subtle)' }}>
          무슨 이야기를 나눌까요?
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {['💬', '📅', '💰', '🗳️'].map(e => (
            <span key={e} style={{ fontSize: '18px' }}>{e}</span>
          ))}
        </div>
      </button>

      {/* 게시물 생성 모달 */}
      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
