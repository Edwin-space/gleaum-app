'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  MessageSquareText,
  QrCode,
  Share2,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { buildChildInviteShareText } from '@/lib/family-child';
import { getNativePlatform } from '@/lib/native';

type Props = {
  desktop: boolean;
  displayName: string;
  inviteUrl: string;
  expiresAt: string;
  onClose: () => void;
};

export function ChildInviteShareSheet({
  desktop,
  displayName,
  inviteUrl,
  expiresAt,
  onClose,
}: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(desktop);
  const shareText = useMemo(
    () => buildChildInviteShareText(displayName, inviteUrl),
    [displayName, inviteUrl],
  );

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(inviteUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 560,
      color: {
        dark: '#1A1B2E',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrError(true);
      });
    return () => {
      active = false;
    };
  }, [inviteUrl]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: '글리움 자녀 초대', text: shareText });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    await copyInvite();
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const openSms = () => {
    const isIos = getNativePlatform() === 'ios' || /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIos ? '&' : '?';
    window.location.href = `sms:${separator}body=${encodeURIComponent(shareText)}`;
  };

  const expiryLabel = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(expiresAt));

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: desktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: desktop
          ? '32px'
          : 'max(var(--app-safe-top), 24px) var(--app-safe-right) 0 var(--app-safe-left)',
        background: 'rgba(10,10,10,0.52)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="child-invite-share-title"
        style={{
          width: '100%',
          maxWidth: desktop ? '560px' : '640px',
          maxHeight: desktop ? 'calc(100dvh - 64px)' : 'calc(100dvh - max(var(--app-safe-top), 24px))',
          overflowY: 'auto',
          padding: desktop ? '28px' : '16px 20px calc(max(var(--app-safe-bottom), 24px) + 32px)',
          borderRadius: desktop ? '28px' : '28px 28px 0 0',
          background: 'var(--theme-surface)',
          color: 'var(--theme-text)',
          border: '1px solid var(--theme-border)',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.18)',
        }}
      >
        {!desktop && (
          <div style={{ width: '48px', height: '5px', margin: '0 auto 18px', borderRadius: '999px', background: 'var(--theme-border)' }} />
        )}
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ margin: '0 0 7px', color: '#0CC9B5', fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em' }}>
              ONE-TIME INVITATION
            </p>
            <h2 id="child-invite-share-title" style={{ margin: 0, fontSize: '22px', fontWeight: 950, letterSpacing: '-0.03em' }}>
              {displayName}님에게 초대 보내기
            </h2>
          </div>
          <button type="button" aria-label="초대 공유 닫기" onClick={onClose} style={iconButtonStyle}>
            <X size={19} />
          </button>
        </header>

        <p style={{ margin: '12px 0 20px', color: 'var(--theme-text-muted)', fontSize: '13px', lineHeight: 1.65 }}>
          문자나 카카오톡 등 원하는 앱으로 전달하세요. 초대받은 계정은 연결 요청 후 보호자 승인을 기다립니다.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: desktop ? 'repeat(3, 1fr)' : '1fr 1fr', gap: '10px' }}>
          <ActionButton icon={<Share2 size={18} />} label="공유하기" primary onClick={() => void share()} />
          <ActionButton icon={<MessageSquareText size={18} />} label="문자로 보내기" onClick={openSms} />
          <ActionButton
            icon={<QrCode size={18} />}
            label={showQr ? 'QR 닫기' : 'QR 보기'}
            onClick={() => setShowQr((current) => !current)}
          />
        </div>

        {showQr && (
          <div style={{ display: 'grid', justifyItems: 'center', gap: '10px', padding: '20px', marginTop: '14px', borderRadius: '24px', background: 'var(--theme-surface-muted)', border: '1px solid var(--theme-border)' }}>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- QR은 브라우저에서 생성한 일회성 data URL이다.
              <img src={qrDataUrl} alt="자녀 계정 연결 초대 QR 코드" width={220} height={220} style={{ width: 'min(220px, 68vw)', height: 'auto', borderRadius: '16px' }} />
            ) : qrError ? (
              <div role="alert" style={{ width: '220px', maxWidth: '68vw', aspectRatio: '1', display: 'grid', placeItems: 'center', padding: '20px', color: 'var(--theme-text-muted)', fontSize: '13px', lineHeight: 1.6, textAlign: 'center' }}>
                QR을 만들지 못했습니다. 공유하기 또는 링크 복사를 이용해 주세요.
              </div>
            ) : (
              <div style={{ width: '220px', maxWidth: '68vw', aspectRatio: '1', display: 'grid', placeItems: 'center', color: 'var(--theme-text-subtle)', fontSize: '13px' }}>
                QR 생성 중...
              </div>
            )}
            <span style={{ color: 'var(--theme-text-muted)', fontSize: '12px' }}>자녀 기기의 카메라로 스캔하세요.</span>
          </div>
        )}

        <div style={{ padding: '15px 16px', marginTop: '14px', borderRadius: '18px', background: 'var(--theme-surface-muted)', border: '1px solid var(--theme-border)' }}>
          <p style={{ margin: '0 0 7px', color: 'var(--theme-text-subtle)', fontSize: '11px', fontWeight: 800 }}>초대 링크</p>
          <p style={{ margin: 0, color: 'var(--theme-text-muted)', fontSize: '12px', lineHeight: 1.5, overflowWrap: 'anywhere' }}>{inviteUrl}</p>
          <p style={{ margin: '8px 0 0', color: 'var(--theme-text-subtle)', fontSize: '11px' }}>{expiryLabel}까지 유효</p>
        </div>

        <button type="button" onClick={() => void copyInvite()} style={{ ...secondaryButtonStyle, width: '100%', marginTop: '12px' }}>
          {copied ? <Check size={17} /> : <Copy size={17} />}
          {copied ? '초대 내용이 복사되었습니다' : '초대 링크와 안내 복사'}
        </button>
      </section>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  primary = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: '52px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '0 14px',
        borderRadius: '999px',
        border: primary ? 0 : '1px solid var(--theme-border)',
        background: primary ? '#0084CC' : 'var(--theme-surface-muted)',
        color: primary ? 'white' : 'var(--theme-text)',
        fontSize: '13px',
        fontWeight: 900,
        cursor: 'pointer',
      }}
    >
      {icon}{label}
    </button>
  );
}

const iconButtonStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  borderRadius: '999px',
  border: '1px solid var(--theme-border)',
  background: 'var(--theme-surface-muted)',
  color: 'var(--theme-text-muted)',
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: '48px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '0 18px',
  borderRadius: '999px',
  border: '1px solid var(--theme-border)',
  background: 'var(--theme-surface-muted)',
  color: 'var(--theme-text)',
  fontSize: '13px',
  fontWeight: 850,
  cursor: 'pointer',
};
