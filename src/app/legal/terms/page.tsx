import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalLayout } from '@/components/layout/LegalLayout';

export const metadata: Metadata = {
  title: '이용약관 | 글리움',
  description: '글리움 서비스의 이용약관입니다.',
};

const EFFECTIVE_DATE = '2026년 5월 13일';
const SERVICE_NAME = '글리움';
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
    return { maxWidth: '760px', margin: '0 auto', padding: '40px 24px 80px' };
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

export default async function TermsPage({ searchParams }: LegalPageProps) {
  const params = searchParams ? await searchParams : {};
  const appView = isAndroidAppView(params.view);
  const tablet = isTabletDevice(params.device);

  return (
    <LegalLayout title="이용약관" variant={appView ? 'app' : 'web'}>
      <div style={getDocumentStyle(appView, tablet)}>

        {/* 시행일 */}
        <div style={{ background: 'rgba(0,132,204,0.1)', borderRadius: '14px', padding: '16px 20px', marginBottom: '36px', border: '1px solid rgba(0,132,204,0.25)' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#0CC9B5', fontWeight: 600 }}>시행일: {EFFECTIVE_DATE}</p>
          <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
            본 약관은 {OPERATOR}(이하 "운영자")가 제공하는 {SERVICE_NAME} 서비스(이하 "서비스")의 이용 조건 및 절차에 관한 사항을 규정합니다.
          </p>
        </div>

        <Section title="제1조 (목적)">
          <p>이 약관은 운영자가 제공하는 {SERVICE_NAME} 애플리케이션 및 웹 서비스의 이용과 관련하여 운영자와 이용자 사이의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
        </Section>

        <Section title="제2조 (정의)">
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li><strong>"서비스"</strong>란 운영자가 제공하는 일정·가계부·공간 관리 앱 및 웹 서비스 전체를 의미합니다.</li>
            <li><strong>"이용자"</strong>란 이 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
            <li><strong>"계정"</strong>이란 이용자가 서비스에 접근하기 위해 생성한 Google 또는 이메일 기반 인증 정보를 말합니다.</li>
            <li><strong>"공간(Space)"</strong>이란 이용자가 생성하거나 참여한 그룹으로, 일정·가계부를 함께 관리하는 단위를 말합니다.</li>
            <li><strong>"콘텐츠"</strong>란 이용자가 서비스 내에 등록한 일정, 가계부 내역, 메모, 첨부파일 등을 말합니다.</li>
          </ul>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.</li>
            <li>운영자는 필요한 경우 약관을 변경할 수 있으며, 변경 시 시행일 7일 전 앱 공지 또는 이메일로 안내합니다.</li>
            <li>변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            <li>변경 공지 후 계속 서비스를 이용하면 변경된 약관에 동의한 것으로 간주합니다.</li>
          </ul>
        </Section>

        <Section title="제4조 (서비스 이용 신청 및 승낙)">
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>이용자는 Google 계정 또는 이메일로 회원가입 후 서비스를 이용할 수 있습니다.</li>
            <li>만 14세 미만은 법정대리인의 동의 없이 회원가입을 할 수 없습니다.</li>
            <li>운영자는 다음에 해당하는 경우 이용 신청을 거부하거나 사후에 이용을 제한할 수 있습니다.
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>타인의 명의 또는 허위 정보를 사용한 경우</li>
                <li>관련 법령을 위반하거나 타인의 권리를 침해한 경우</li>
                <li>서비스의 정상적인 운영을 방해하는 경우</li>
              </ul>
            </li>
          </ul>
        </Section>

        <Section title="제5조 (서비스의 제공)">
          <p>운영자가 제공하는 주요 서비스는 다음과 같습니다.</p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>개인 일정 등록·수정·삭제·조회</li>
            <li>공간(Space) 생성·참여·관리 및 공유 일정 관리</li>
            <li>개인 가계부 및 공간 내 공동 지출 등록·조회</li>
            <li>일정 리마인더 및 FCM 푸시 알림</li>
            <li>기기 캘린더 연동 (향후 업데이트 예정)</li>
          </ul>
          <p style={{ marginTop: '12px' }}>서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검·장애·천재지변 등의 경우 일시 중단될 수 있습니다.</p>
        </Section>

        <Section title="제6조 (이용자의 의무)">
          <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>타인의 계정을 도용하거나 허위 정보를 등록하는 행위</li>
            <li>서비스를 이용하여 타인의 개인정보를 무단 수집·유포하는 행위</li>
            <li>서비스의 운영을 방해하거나 서버에 과도한 부하를 주는 행위</li>
            <li>운영자의 사전 동의 없이 서비스를 상업적 목적으로 이용하는 행위</li>
            <li>관련 법령 및 이 약관을 위반하는 행위</li>
          </ul>
        </Section>

        <Section title="제7조 (콘텐츠의 소유권)">
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>이용자가 서비스에 등록한 콘텐츠의 저작권은 해당 이용자에게 귀속됩니다.</li>
            <li>운영자는 서비스 제공 및 개선 목적으로만 이용자의 콘텐츠를 활용할 수 있습니다.</li>
            <li>서비스의 UI, 디자인, 로고, 소프트웨어 등에 관한 지식재산권은 운영자에게 귀속됩니다.</li>
          </ul>
        </Section>

        <Section title="제8조 (공간(Space) 이용)">
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>공간을 생성한 이용자는 공간 지기(Admin) 역할을 가지며 멤버를 초대·제거할 수 있습니다.</li>
            <li>공간 내에서 공유된 일정·가계부 정보는 해당 공간의 멤버 전체에게 공개됩니다.</li>
            <li>공간 지기가 탈퇴하는 경우, 다른 멤버에게 공간 지기 권한이 자동 이전될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="제9조 (서비스 이용 제한 및 계정 해지)">
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>운영자는 이용자가 제6조를 위반한 경우 사전 통보 없이 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.</li>
            <li>이용자는 앱 내 [마이페이지 → 회원탈퇴]를 통해 언제든지 계정을 삭제할 수 있습니다.</li>
            <li>회원 탈퇴 시 이용자의 모든 데이터는 즉시 삭제되며, 법령에 따라 보존이 필요한 정보는 별도 보관됩니다.</li>
          </ul>
        </Section>

        <Section title="제10조 (운영자의 면책)">
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>운영자는 천재지변, 전쟁, 해킹 등 불가항력적 사유로 서비스가 중단된 경우 책임을 지지 않습니다.</li>
            <li>이용자의 귀책 사유로 발생한 서비스 이용 장애에 대해 운영자는 책임을 지지 않습니다.</li>
            <li>이용자가 서비스를 통해 타 이용자와 분쟁이 발생한 경우, 운영자는 중재 의무를 지지 않습니다.</li>
            <li>서비스는 현재 상태(as-is)로 제공되며, 특정 목적 적합성을 보증하지 않습니다.</li>
          </ul>
        </Section>

        <Section title="제11조 (준거법 및 관할)">
          <ul style={{ paddingLeft: '20px', lineHeight: '1.9' }}>
            <li>이 약관은 대한민국 법령에 따라 해석·적용됩니다.</li>
            <li>서비스와 관련한 분쟁은 대한민국 법원을 관할 법원으로 합니다.</li>
          </ul>
        </Section>

        <Section title="제12조 (문의)">
          <p>서비스 이용과 관련한 문의는 아래 연락처로 해주세요.</p>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px 18px', marginTop: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>운영자:</strong> {OPERATOR}<br />
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>이메일:</strong> <a href={`mailto:${EMAIL}`} style={{ color: '#0CC9B5' }}>{EMAIL}</a>
            </p>
          </div>
        </Section>

        {/* 하단 링크 */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '16px' }}>
          <Link href="/legal/privacy" style={{ fontSize: '13px', color: '#0CC9B5', textDecoration: 'underline' }}>개인정보처리방침 보기</Link>
          <Link href="/legal/delete-account" style={{ fontSize: '13px', color: 'rgba(255,100,100,0.85)', textDecoration: 'underline' }}>계정 및 데이터 삭제 요청</Link>
        </div>
      </div>
    </LegalLayout>
  );
}

/* ── 하위 컴포넌트 ─────────────────────────────────────────────────── */

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
