import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalLayout } from '@/components/layout/LegalLayout';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 글리움',
  description: '글리움 서비스의 개인정보처리방침입니다.',
};

const EFFECTIVE_DATE = '2026년 5월 13일';
const OPERATOR = '유태성';
const EMAIL = 'helper@gleaum.com';

type LegalPageProps = {
  searchParams?: Promise<{ view?: string | string[]; device?: string | string[] }>;
};

function isAndroidAppView(view: string | string[] | undefined) {
  return Array.isArray(view) ? view.includes('android-app') : view === 'android-app';
}

function isTabletDevice(device: string | string[] | undefined) {
  return Array.isArray(device) ? device.includes('tablet') : device === 'tablet';
}

function getDocumentStyle(appView: boolean, tablet: boolean): React.CSSProperties {
  if (!appView) {
    return { maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' };
  }

  return tablet
    ? {
        width: '100%',
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '48px 72px 112px',
        boxSizing: 'border-box',
      }
    : {
        width: '100%',
        maxWidth: 'none',
        margin: 0,
        padding: '28px 22px 88px',
        boxSizing: 'border-box',
      };
}

export default async function PrivacyPage({ searchParams }: LegalPageProps) {
  const params = searchParams ? await searchParams : {};
  const appView = isAndroidAppView(params.view);
  const tablet = isTabletDevice(params.device);

  return (
    <LegalLayout title="개인정보처리방침" variant={appView ? 'app' : 'web'}>
      <div style={getDocumentStyle(appView, tablet)}>

        {/* 시행일 */}
        <div style={{ background: 'rgba(0,132,204,0.1)', borderRadius: '14px', padding: '16px 20px', marginBottom: '36px', border: '1px solid rgba(0,132,204,0.25)' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#0CC9B5', fontWeight: 600 }}>시행일: {EFFECTIVE_DATE}</p>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
            글리움(이하 "서비스")은 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」을 준수합니다.
          </p>
        </div>

        <Section title="제1조 (수집하는 개인정보 항목)">
          <p>서비스는 다음과 같은 개인정보를 수집합니다.</p>
          <Table
            headers={['구분', '수집 항목', '수집 방법']}
            rows={[
              ['회원가입 (Google)', '이메일 주소, 이름, 프로필 사진', 'Google OAuth 인증'],
              ['회원가입 (이메일)', '이메일 주소, 비밀번호(암호화)', '직접 입력'],
              ['서비스 이용', '일정 정보, 가계부 내역, 공간(Space) 정보', '앱 내 직접 입력'],
              ['알림 서비스', 'FCM 푸시 알림 토큰', '앱 자동 수집'],
              ['자동 수집', '접속 IP, 기기 정보, 이용 기록, 쿠키', '시스템 자동 수집'],
            ]}
          />
          <Note>서비스는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.</Note>
        </Section>

        <Section title="제2조 (개인정보의 수집 및 이용 목적)">
          <p>수집된 개인정보는 다음의 목적으로만 이용됩니다.</p>
          <List items={[
            '회원 가입 및 본인 확인',
            '일정·가계부·공간 관리 서비스 제공',
            '푸시 알림 및 리마인더 발송',
            '공간(Space) 초대 코드 기반 그룹 관리',
            '서비스 개선 및 통계 분석 (개인 식별 불가 형태)',
            '고객 문의 및 민원 처리',
            '법령상 의무 이행',
          ]} />
        </Section>

        <Section title="제3조 (개인정보의 보유 및 이용 기간)">
          <p>서비스는 회원 탈퇴 시 즉시 개인정보를 파기합니다. 단, 관련 법령에 따라 아래 정보는 해당 기간 보관합니다.</p>
          <Table
            headers={['항목', '근거 법령', '보유 기간']}
            rows={[
              ['계약·청약 철회 기록', '전자상거래법', '5년'],
              ['소비자 불만·분쟁 처리 기록', '전자상거래법', '3년'],
              ['접속 로그', '통신비밀보호법', '3개월'],
            ]}
          />
        </Section>

        <Section title="제4조 (개인정보의 제3자 제공)">
          <p>서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외입니다.</p>
          <List items={[
            '이용자가 사전에 동의한 경우',
            '법령의 규정에 의거하거나 수사기관의 적법한 요청이 있는 경우',
          ]} />
        </Section>

        <Section title="제5조 (개인정보 처리 위탁)">
          <p>서비스는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.</p>
          <Table
            headers={['수탁업체', '위탁 업무', '보유 기간']}
            rows={[
              ['Supabase, Inc.', '회원 인증 및 데이터베이스 관리', '회원 탈퇴 시까지'],
              ['Vercel, Inc.', '서버 및 애플리케이션 호스팅', '회원 탈퇴 시까지'],
              ['Google LLC', '소셜 로그인(OAuth), 푸시 알림(FCM)', '회원 탈퇴 시까지'],
            ]}
          />
        </Section>

        <Section title="제6조 (이용자의 권리)">
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <List items={[
            '개인정보 열람 요청',
            '오류 정정 요청',
            '삭제 요청 (회원 탈퇴)',
            '처리 정지 요청',
          ]} />
          <p>권리 행사는 앱 내 [마이페이지 → 회원 탈퇴] 또는 이메일({EMAIL})로 요청하실 수 있습니다.</p>
        </Section>

        <Section title="제7조 (개인정보의 파기)">
          <p>서비스는 보유 기간이 경과하거나 처리 목적이 달성된 경우 해당 개인정보를 지체 없이 파기합니다.</p>
          <List items={[
            '전자적 파일 형태: 복구 불가능한 방법으로 영구 삭제',
            '종이 문서: 분쇄 또는 소각',
          ]} />
        </Section>

        <Section title="제8조 (쿠키의 사용)">
          <p>서비스는 이용자 인증 및 서비스 유지를 위해 쿠키(Cookie)를 사용합니다. 이용자는 브라우저 설정을 통해 쿠키를 거부할 수 있으나, 이 경우 서비스 이용에 제한이 생길 수 있습니다.</p>
        </Section>

        <Section title="제9조 (개인정보 보호책임자)">
          <Table
            headers={['항목', '내용']}
            rows={[
              ['성명', OPERATOR],
              ['이메일', EMAIL],
            ]}
          />
          <p>개인정보 관련 불편사항, 열람·정정·삭제 요청은 위 이메일로 문의해 주세요. 요청 접수 후 10일 이내 처리 결과를 안내합니다.</p>
        </Section>

        <Section title="제10조 (개인정보 침해 신고)">
          <p>개인정보 침해로 인한 신고나 상담은 아래 기관에 문의하실 수 있습니다.</p>
          <List items={[
            '개인정보 침해신고센터: privacy.kisa.or.kr / ☎ 118',
            '개인정보 분쟁조정위원회: www.kopico.go.kr / ☎ 1833-6972',
            '대검찰청 사이버수사과: www.spo.go.kr / ☎ 1301',
            '경찰청 사이버안전국: ecrm.cyber.go.kr / ☎ 182',
          ]} />
        </Section>

        <Section title="제11조 (방침의 변경)">
          <p>이 개인정보처리방침은 법령·정책 변경 또는 서비스 개선을 위해 변경될 수 있습니다. 변경 시 시행일 7일 전부터 앱 공지 또는 이메일로 안내합니다.</p>
          <Note>현재 버전 시행일: {EFFECTIVE_DATE}</Note>
        </Section>

        {/* 하단 링크 */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/legal/terms" style={{ fontSize: '13px', color: '#0CC9B5', textDecoration: 'underline' }}>이용약관 보기</Link>
          <Link href="/legal/delete-account" style={{ fontSize: '13px', color: 'rgba(255,100,100,0.85)', textDecoration: 'underline' }}>계정 및 데이터 삭제 요청</Link>
        </div>
      </div>
    </LegalLayout>
  );
}

/* ── 하위 컴포넌트 (다크 테마) ───────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontSize: '16px', fontWeight: 700, color: '#FFFFFF',
        marginBottom: '14px', paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        {title}
      </h2>
      <div style={{ fontSize: '14px', lineHeight: '1.85', color: 'rgba(255,255,255,0.68)' }}>
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
      {items.map((item) => (
        <li key={item} style={{ marginBottom: '7px', color: 'rgba(255,255,255,0.68)' }}>{item}</li>
      ))}
    </ul>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', margin: '14px 0', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.08)' }}>
            {headers.map((h) => (
              <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'top' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 16px', marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}
