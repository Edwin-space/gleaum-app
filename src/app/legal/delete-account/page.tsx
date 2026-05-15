import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '계정 및 데이터 삭제 요청 | 글리움',
  description: '글리움 계정 및 관련 데이터 삭제를 요청하는 방법을 안내합니다.',
};

const EMAIL = 'helper@gleaum.com';
const OPERATOR = '유태성';

export default function DeleteAccountPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAFD', fontFamily: "'Pretendard', sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: 'white', borderBottom: '1px solid #F0F0F5', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/legal/privacy" style={{ color: '#1A1B2E', textDecoration: 'none', fontSize: '22px', lineHeight: 1 }}>←</Link>
        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1A1B2E' }}>계정 및 데이터 삭제 요청</h1>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* 안내 배너 */}
        <div style={{ background: 'rgba(234,67,53,0.06)', borderRadius: '12px', padding: '14px 18px', marginBottom: '32px', border: '1px solid rgba(234,67,53,0.15)' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#C62828', fontWeight: 600 }}>⚠️ 계정 삭제 시 모든 데이터가 영구적으로 삭제됩니다</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
            삭제된 데이터는 복구할 수 없습니다. 삭제 전 필요한 데이터를 미리 확인해 주세요.
          </p>
        </div>

        {/* 방법 1: 앱 내 직접 삭제 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1B2E', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #EEEEF5' }}>
            방법 1. 앱 내에서 직접 삭제 (즉시 처리)
          </h2>
          <div style={{ fontSize: '14px', lineHeight: '1.75', color: '#3A3A4A' }}>
            <p>글리움 앱에 로그인한 상태에서 아래 경로로 이동하면 즉시 계정 및 모든 데이터를 삭제할 수 있습니다.</p>

            <div style={{ background: '#F5F5FB', borderRadius: '12px', padding: '16px 20px', margin: '16px 0' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1A1B2E' }}>삭제 경로</p>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#3A3A4A' }}>
                마이페이지 → 계정 설정 → <strong style={{ color: '#C62828' }}>회원 탈퇴</strong>
              </p>
            </div>

            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#666' }}>
              웹 서비스: <a href="https://www.gleaum.com/mypage" style={{ color: '#0084CC' }}>https://www.gleaum.com/mypage</a>
            </p>
          </div>
        </section>

        {/* 방법 2: 이메일 요청 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1B2E', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #EEEEF5' }}>
            방법 2. 이메일로 삭제 요청 (앱 접근이 어려운 경우)
          </h2>
          <div style={{ fontSize: '14px', lineHeight: '1.75', color: '#3A3A4A' }}>
            <p>앱에 접근할 수 없거나 도움이 필요한 경우, 아래 이메일로 삭제를 요청할 수 있습니다. 요청 접수 후 <strong>영업일 기준 3일 이내</strong>에 처리됩니다.</p>

            <div style={{ background: '#F5F5FB', borderRadius: '12px', padding: '16px 20px', margin: '16px 0' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1A1B2E' }}>이메일 요청 시 포함할 내용</p>
              <ul style={{ margin: '8px 0 0', paddingLeft: '20px', lineHeight: '2' }}>
                <li>제목: <strong>[데이터 삭제 요청] 글리움 계정 삭제</strong></li>
                <li>가입 시 사용한 이메일 주소</li>
                <li>삭제 요청 이유 (선택사항)</li>
              </ul>
            </div>

            <div style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', border: '1px solid #EEEEF5', marginTop: '12px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#1A1B2E' }}>
                <strong>운영자:</strong> {OPERATOR}<br />
                <strong>이메일:</strong>{' '}
                <a href={`mailto:${EMAIL}?subject=[데이터 삭제 요청] 글리움 계정 삭제`} style={{ color: '#0084CC' }}>
                  {EMAIL}
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* 삭제 데이터 범위 */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1B2E', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #EEEEF5' }}>
            삭제되는 데이터 범위
          </h2>
          <div style={{ fontSize: '14px', lineHeight: '1.75', color: '#3A3A4A' }}>
            <p>계정 삭제 시 아래 데이터가 <strong>즉시 삭제</strong>됩니다.</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
              <li>계정 정보 (이메일, 이름, 프로필 사진)</li>
              <li>개인 일정 및 메모</li>
              <li>가계부 내역 (개인 지출)</li>
              <li>공간(Space) 멤버십 및 관련 공유 데이터</li>
              <li>FCM 푸시 알림 토큰</li>
              <li>앱 설정 및 기기 연동 정보</li>
            </ul>

            <div style={{ background: 'rgba(12,201,181,0.06)', borderRadius: '10px', padding: '12px 16px', marginTop: '12px', border: '1px solid rgba(12,201,181,0.15)' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#0A9E5C', fontWeight: 600 }}>법령에 따라 보관되는 데이터</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
                전자상거래법에 따라 거래 기록은 최대 5년, 접속 로그는 통신비밀보호법에 따라 3개월 보관됩니다.
                상세 내용은 <Link href="/legal/privacy" style={{ color: '#0084CC' }}>개인정보처리방침</Link>을 참조하세요.
              </p>
            </div>
          </div>
        </section>

        {/* 하단 링크 */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #EEEEF5', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/legal/privacy" style={{ fontSize: '13px', color: '#0084CC', textDecoration: 'underline' }}>개인정보처리방침</Link>
          <Link href="/legal/terms" style={{ fontSize: '13px', color: '#0084CC', textDecoration: 'underline' }}>이용약관</Link>
        </div>

      </div>
    </div>
  );
}
