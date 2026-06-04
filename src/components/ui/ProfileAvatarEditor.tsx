'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { uploadProfileAvatar, updateMyProfile } from '@/lib/db';

type Tab = 'photo' | 'emoji';

const CROP_SIZE = 260;
const EXPORT_SIZE = 300;

// ── 이모지 카테고리 ────────────────────────────────────────────────────
const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: '얼굴',
    icon: '😊',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇',
      '🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝',
      '🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄',
      '😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧',
      '🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟',
      '🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢',
      '😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬',
      '😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖',
    ],
  },
  {
    label: '동물',
    icon: '🐶',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷',
      '🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇',
      '🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🦂',
      '🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳',
      '🐋','🦈','🐊','🐅','🐆','🦓','🐘','🦛','🦏','🐪','🐫','🦒','🦘',
      '🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮',
      '🐈','🐓','🦃','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦦',
      '🦥','🐁','🐀','🐿️','🦔',
    ],
  },
  {
    label: '자연',
    icon: '🌸',
    emojis: [
      '🌸','🌺','🌻','🌹','🌷','🌼','💐','🍀','🌿','🍃','🍂','🍁','🌱',
      '🌲','🌳','🌴','🌵','🌾','🍄','🪨','🪵','🌍','🌎','🌏','🌙','🌚',
      '🌛','🌜','🌞','⭐','🌟','💫','✨','🌈','⛅','🌤️','☁️','🌧️','⛈️',
      '🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','🌪️','🌊','💧','💦','🔥','🌋',
    ],
  },
  {
    label: '음식',
    icon: '🍎',
    emojis: [
      '🍎','🍊','🍋','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅',
      '🍆','🥑','🥦','🥕','🌽','🌶️','🥒','🥬','🧅','🥔','🍠','🥐','🥖',
      '🍞','🧀','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟',
      '🍕','🥪','🌮','🌯','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤',
      '🍙','🍚','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🍯',
      '🧃','🥤','🧋','☕','🍵','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🍾',
    ],
  },
  {
    label: '활동',
    icon: '⚽',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥊',
      '🥋','🎽','⛷️','🏂','🏋️','🤺','🏊','🚴','🧘','🏄','🤽','🚣','🏹',
      '🎿','🛷','🥌','🎯','🎳','🎮','🎲','♟️','🎭','🎨','🎬','🎤','🎧',
      '🎼','🎹','🥁','🪘','🎷','🎺','🎸','🎻','🎀','🎁','🎈','🎉','🎊',
    ],
  },
  {
    label: '사물',
    icon: '💎',
    emojis: [
      '💎','👑','🏆','🥇','🎖️','🏅','🔮','🧿','🌐','⛩️','🕌','⛪','🕍',
      '🕋','🗺️','🧭','🌋','⛰️','🏔️','🏕️','🏖️','🏜️','🏝️','🌅','🌄',
      '🌠','🏞️','🌃','🌉','🌌','🌁','🗼','🗽','🏰','🏯','🚀','🛸','🌙',
      '🪐','☀️','🌤','⚡','🌊','🏠','🏡','🏢','🏣','🏥','🏦','🏧','🏨',
      '🏩','🏪','🏫','🏬','🏭','🏯','⛺','🌈','🎠','🎡','🎢',
    ],
  },
];

// ── Props ─────────────────────────────────────────────────────────────
interface ProfileAvatarEditorProps {
  currentAvatar: string;
  onClose: () => void;
  onSaved: (newAvatar: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────
export function ProfileAvatarEditor({ currentAvatar, onClose, onSaved }: ProfileAvatarEditorProps) {
  const isUrl = currentAvatar.startsWith('http') || currentAvatar.startsWith('blob') || currentAvatar.startsWith('data:');

  const [tab, setTab] = useState<Tab>(isUrl ? 'photo' : 'emoji');
  const [emojiCat, setEmojiCat] = useState(0);

  // ── Photo state ──
  const [imgSrc, setImgSrc] = useState<string | null>(isUrl ? currentAvatar : null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [userScale, setUserScale] = useState(1);   // 1x = fit-to-fill
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const lastPosRef = useRef({ x: 0, y: 0 });
  const galleryRef  = useRef<HTMLInputElement>(null);
  const cameraRef   = useRef<HTMLInputElement>(null);
  const catBarRef   = useRef<HTMLDivElement>(null);

  // Base scale: smallest multiplier to fill the CROP_SIZE circle
  const baseScale = naturalSize.w > 0 && naturalSize.h > 0
    ? Math.max(CROP_SIZE / naturalSize.w, CROP_SIZE / naturalSize.h)
    : 1;
  const effectiveScale = baseScale * userScale;

  // When current avatar URL is loaded, measure its dimensions
  useEffect(() => {
    if (imgSrc && naturalSize.w === 0) {
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = imgSrc;
    }
  }, [imgSrc]);

  const initForImage = (src: string) => {
    setImgSrc(src);
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setUserScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      initForImage(src);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Drag helpers ──
  const getXY = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      const t = (e as React.TouchEvent).touches[0];
      return { x: t.clientX, y: t.clientY };
    }
    const m = e as React.MouseEvent;
    return { x: m.clientX, y: m.clientY };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    lastPosRef.current = getXY(e);
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const pos = getXY(e);
    const dx = pos.x - lastPosRef.current.x;
    const dy = pos.y - lastPosRef.current.y;
    lastPosRef.current = pos;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const onPointerUp = () => setIsDragging(false);

  // ── Save photo ──
  const handleSavePhoto = async () => {
    if (!imgSrc || naturalSize.w === 0) return;
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width  = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const ctx = canvas.getContext('2d')!;

      // Circular clip
      ctx.beginPath();
      ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgSrc;
      await new Promise<void>(resolve => {
        if (img.complete) resolve();
        else img.onload = () => resolve();
      });

      const ratio  = EXPORT_SIZE / CROP_SIZE;
      const drawW  = naturalSize.w * effectiveScale * ratio;
      const drawH  = naturalSize.h * effectiveScale * ratio;
      const drawX  = EXPORT_SIZE / 2 + offset.x * ratio - drawW / 2;
      const drawY  = EXPORT_SIZE / 2 + offset.y * ratio - drawH / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const url = await uploadProfileAvatar(blob, 'jpg');
          if (url) { onSaved(url); onClose(); }
        }
        setSaving(false);
      }, 'image/jpeg', 0.85);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  // ── Save emoji ──
  const handleSaveEmoji = async (emoji: string) => {
    setSaving(true);
    try {
      await updateMyProfile({ avatar: emoji });
      onSaved(emoji);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
      onClick={onClose}
    >
      {/* Sheet */}
      <div
        style={{
          width: '100%', maxWidth: '520px',
          background: '#FAFAFA',
          borderRadius: '28px 28px 0 0',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)',
          overflowY: 'auto',
          maxHeight: '92dvh',
          animation: 'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Handle bar ── */}
        <div style={{ paddingTop: '12px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '999px', background: '#DDDDE3' }} />
        </div>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 0',
        }}>
          <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--theme-text)', margin: 0 }}>
            프로필 사진
          </p>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: '#EBEBF0', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', color: 'var(--theme-text-subtle)', fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', padding: '16px 20px 0', gap: '8px' }}>
          {(['photo', 'emoji'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, height: '42px', borderRadius: '14px',
                fontSize: '14px', fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: tab === t
                  ? 'linear-gradient(135deg,#0CC9B5,#0084CC)'
                  : '#EBEBF0',
                color: tab === t ? 'white' : '#8E8E93',
                transition: 'all 0.18s',
              }}
            >
              {t === 'photo' ? '📷 사진' : '😊 이모지'}
            </button>
          ))}
        </div>

        {/* ── Photo Tab ── */}
        {tab === 'photo' && (
          <div style={{ padding: '20px' }}>
            {/* Hidden file inputs */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="user"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {!imgSrc ? (
              /* ── Upload buttons ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: '0 0 4px', textAlign: 'center' }}>
                  프로필에 사용할 사진을 선택하거나 촬영하세요
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Camera */}
                  <button
                    onClick={() => cameraRef.current?.click()}
                    style={{
                      padding: '28px 16px',
                      borderRadius: '20px',
                      background: 'var(--theme-surface)',
                      border: '1.5px solid rgba(0,132,204,0.15)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: '10px',
                    }}
                  >
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '18px',
                      background: 'rgba(0,132,204,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '26px',
                    }}>
                      📷
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>카메라</p>
                      <p style={{ fontSize: '11px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0 }}>즉시 촬영</p>
                    </div>
                  </button>

                  {/* Gallery */}
                  <button
                    onClick={() => galleryRef.current?.click()}
                    style={{
                      padding: '28px 16px',
                      borderRadius: '20px',
                      background: 'var(--theme-surface)',
                      border: '1.5px solid rgba(12,201,181,0.15)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: '10px',
                    }}
                  >
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '18px',
                      background: 'rgba(12,201,181,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '26px',
                    }}>
                      🖼️
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--theme-text)', margin: '0 0 2px' }}>앨범</p>
                      <p style={{ fontSize: '11px', color: 'var(--theme-text-subtle)', fontWeight: 600, margin: 0 }}>갤러리에서 선택</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* ── Crop editor ── */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {/* Circular crop area */}
                <div style={{ position: 'relative' }}>
                  {/* Outer ring decoration */}
                  <div style={{
                    width: CROP_SIZE + 8, height: CROP_SIZE + 8,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0CC9B5, #0084CC)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {/* Crop circle */}
                    <div
                      style={{
                        width: CROP_SIZE, height: CROP_SIZE,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        position: 'relative',
                        userSelect: 'none',
                        touchAction: 'none',
                        background: '#1A1B2E',
                      }}
                      onMouseDown={onPointerDown}
                      onMouseMove={onPointerMove}
                      onMouseUp={onPointerUp}
                      onMouseLeave={onPointerUp}
                      onTouchStart={onPointerDown}
                      onTouchMove={onPointerMove}
                      onTouchEnd={onPointerUp}
                    >
                      {imgSrc && naturalSize.w > 0 && (
                        <img
                          src={imgSrc}
                          alt=""
                          draggable={false}
                          style={{
                            position: 'absolute',
                            width:  naturalSize.w * effectiveScale,
                            height: naturalSize.h * effectiveScale,
                            left: '50%',
                            top:  '50%',
                            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </div>
                  </div>
                  {/* Drag hint */}
                  <p style={{
                    position: 'absolute', bottom: -26, left: 0, right: 0,
                    textAlign: 'center', fontSize: '11px', color: 'var(--theme-text-subtle)', fontWeight: 600,
                  }}>
                    드래그로 위치 조정
                  </p>
                </div>

                {/* Zoom slider */}
                <div style={{ width: '100%', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px' }}>🔍</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={userScale}
                      onChange={e => setUserScale(parseFloat(e.target.value))}
                      style={{
                        flex: 1, height: '4px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        borderRadius: '999px',
                        background: `linear-gradient(to right, #0084CC ${((userScale - 1) / 2) * 100}%, #E5E5EA ${((userScale - 1) / 2) * 100}%)`,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '14px' }}>🔎</span>
                  </div>
                </div>

                {/* Action row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                  <button
                    onClick={() => { setImgSrc(null); setNaturalSize({ w: 0, h: 0 }); }}
                    style={{
                      height: '52px', borderRadius: '18px', fontSize: '15px',
                      fontWeight: 700, border: 'none', cursor: 'pointer',
                      background: '#EBEBF0', color: 'var(--theme-text-subtle)',
                    }}
                  >
                    다시 선택
                  </button>
                  <button
                    onClick={handleSavePhoto}
                    disabled={saving}
                    style={{
                      height: '52px', borderRadius: '18px', fontSize: '15px',
                      fontWeight: 800, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                      background: 'linear-gradient(135deg,#0CC9B5,#0084CC)',
                      color: 'white',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? '저장 중...' : '적용하기'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Emoji Tab ── */}
        {tab === 'emoji' && (
          <div style={{ padding: '16px 0 0' }}>
            {/* Category bar */}
            <div
              ref={catBarRef}
              style={{
                display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 20px 12px',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  onClick={() => setEmojiCat(i)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: '14px',
                    border: 'none', cursor: 'pointer',
                    background: emojiCat === i
                      ? 'linear-gradient(135deg,rgba(12,201,181,0.15),rgba(0,132,204,0.15))'
                      : 'white',
                    boxShadow: emojiCat === i ? 'inset 0 0 0 1.5px rgba(0,132,204,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'all 0.16s',
                  }}
                >
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{cat.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: emojiCat === i ? '#0084CC' : '#8E8E93', whiteSpace: 'nowrap' }}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              padding: '4px 12px 8px',
              maxHeight: '320px',
              overflowY: 'auto',
              scrollbarWidth: 'none',
            }}>
              {EMOJI_CATEGORIES[emojiCat].emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => !saving && handleSaveEmoji(emoji)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: 'none', cursor: 'pointer',
                    background: currentAvatar === emoji ? 'rgba(0,132,204,0.12)' : 'transparent',
                    boxShadow: currentAvatar === emoji ? 'inset 0 0 0 2px rgba(0,132,204,0.5)' : 'none',
                    fontSize: '26px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                    transition: 'transform 0.12s, background 0.12s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.85)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.85)')}
                  onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {saving && (
              <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--theme-text-subtle)', fontSize: '13px', fontWeight: 600 }}>
                저장 중...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
