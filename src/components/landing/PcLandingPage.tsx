'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  CircleDollarSign,
  Globe2,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import styles from './PcLandingPage.module.css';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gleaum.app';

const FEATURES = [
  {
    icon: LayoutDashboard,
    eyebrow: 'HOME',
    title: '오늘 필요한 것만 한 화면에',
    description: '오늘 일정, 활성 공간, 최근 흐름을 한 번에 확인하고 필요한 기능으로 바로 이동합니다.',
  },
  {
    icon: CalendarDays,
    eyebrow: 'SCHEDULE',
    title: '개인과 공유 일정을 명확하게',
    description: '내 일정과 공간 일정을 구분해 관리하고, 기기 캘린더의 일정도 선택해 가져올 수 있습니다.',
  },
  {
    icon: UsersRound,
    eyebrow: 'SPACE',
    title: '관계마다 독립적인 공간',
    description: '연인, 가족, 모임별로 일정과 소식을 나누되 개인 데이터와 공간 데이터의 경계를 지킵니다.',
  },
  {
    icon: WalletCards,
    eyebrow: 'BUDGET',
    title: '개인 자금 흐름을 한눈에',
    description: '수입과 지출, 고정 항목을 분리해 기록하고 월별 흐름을 놓치지 않도록 정리합니다.',
  },
];

export function PcLandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="글리움 홈">
          <GleaumLogoImg size={34} />
          <GleaumBI variant="auto" width={106} />
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <a href="#service">서비스</a>
          <a href="#features">기능</a>
          <a href="#platforms">플랫폼</a>
        </nav>
        <div className={styles.headerActions}>
          <Link href="/login" className={styles.textLink}>웹에서 시작</Link>
          <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className={styles.headerCta}>
            Android 앱
          </a>
        </div>
      </header>

      <section className={styles.hero} id="service">
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span />
            나, 그리고 소중한 사람들의 일상 네트워크
          </div>
          <h1>
            흩어진 일상을
            <br />
            <em>하나의 흐름으로.</em>
          </h1>
          <p>
            내 일정과 가계부는 온전히 나답게,
            <br className={styles.desktopBreak} />
            함께하는 일정과 소식은 관계별 공간에서 선명하게 연결하세요.
          </p>
          <div className={styles.heroActions}>
            <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className={styles.primaryCta}>
              Google Play에서 시작
              <ArrowRight size={18} />
            </a>
            <Link href="/login" className={styles.secondaryCta}>
              웹 서비스 이용
            </Link>
          </div>
          <div className={styles.trustRow}>
            <span><Check size={15} /> 개인·공간 데이터 분리</span>
            <span><Check size={15} /> Android 네이티브 지원</span>
            <span><Check size={15} /> 무료로 시작</span>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="현재 글리움 Android 화면을 재구성한 미리보기">
          <div className={styles.orbitOne} />
          <div className={styles.orbitTwo} />
          <PhoneShell variant="home" className={styles.heroPhone} />
          <div className={`${styles.floatingNote} ${styles.noteSchedule}`}>
            <CalendarDays size={18} />
            <div>
              <strong>오늘 일정</strong>
              <span>필요한 흐름만 바로 확인</span>
            </div>
          </div>
          <div className={`${styles.floatingNote} ${styles.noteSpace}`}>
            <UsersRound size={18} />
            <div>
              <strong>가족 공간</strong>
              <span>개인 정보와 분리해 연결</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.productStrip} aria-label="지원 기능">
        <span>오늘 홈</span>
        <i />
        <span>개인·공유 일정</span>
        <i />
        <span>관계별 공간</span>
        <i />
        <span>개인 가계부</span>
        <i />
        <span>알림과 보안</span>
      </section>

      <section className={styles.featuresSection} id="features">
        <SectionHeading
          eyebrow="CONNECTED, NOT COMPLICATED"
          title="함께 쓰지만, 뒤섞이지 않도록"
          description="실제 Android 서비스의 현재 정보 구조를 기준으로 핵심 기능을 다시 정리했습니다."
        />
        <div className={styles.featureGrid}>
          {FEATURES.map(({ icon: Icon, eyebrow, title, description }) => (
            <article className={styles.featureCard} key={title}>
              <div className={styles.featureTop}>
                <span className={styles.featureIcon}><Icon size={23} /></span>
                <span className={styles.featureEyebrow}>{eyebrow}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.showcaseSection}>
        <div className={styles.showcaseCopy}>
          <span className={styles.sectionKicker}>ONE DAY, ONE VIEW</span>
          <h2>앱을 열면<br />오늘이 먼저 보입니다.</h2>
          <p>
            여러 메뉴를 돌아다니기 전에 오늘 일정과 현재 공간의 흐름을 먼저 확인합니다.
            비어 있는 상태에서도 다음 행동을 분명하게 안내합니다.
          </p>
          <ul className={styles.checkList}>
            <li><Check size={17} /> 오늘 일정과 향후 일정 요약</li>
            <li><Check size={17} /> 일정 등록과 주요 기능 바로가기</li>
            <li><Check size={17} /> 휴대전화·태블릿에 맞춘 화면 구성</li>
          </ul>
        </div>
        <div className={styles.screenGallery}>
          <PhoneShell variant="schedule" className={styles.galleryBack} />
          <PhoneShell variant="home" className={styles.galleryFront} />
        </div>
      </section>

      <section className={styles.spaceSection}>
        <div className={styles.spaceVisual}>
          <PhoneShell variant="space" />
        </div>
        <div className={styles.showcaseCopy}>
          <span className={styles.sectionKicker}>YOUR CIRCLE, YOUR SPACE</span>
          <h2>공간은 설정 화면이 아니라<br />함께하는 생활의 중심입니다.</h2>
          <p>
            공간에서는 멤버, 일정, 소식이 관계의 맥락 안에서 연결됩니다.
            개인 기록은 다른 공간에 섞이지 않으며 가족 공간은 보호자와 자녀 연결 절차를 별도로 둡니다.
          </p>
          <div className={styles.valueCards}>
            <div><UsersRound size={20} /><strong>관계별 멤버와 역할</strong><span>일반·가족 공간의 맥락 분리</span></div>
            <div><ShieldCheck size={20} /><strong>승인 기반 자녀 연결</strong><span>보호자 확인 후 권한 부여</span></div>
          </div>
        </div>
      </section>

      <section className={styles.platformSection} id="platforms">
        <SectionHeading
          eyebrow="ONE SERVICE, RIGHT EXPERIENCE"
          title="같은 데이터, 플랫폼에 맞는 경험"
          description="웹과 Android는 같은 서비스 모델을 사용하며, 화면은 각 환경에 맞게 구성합니다."
          align="center"
        />
        <div className={styles.platformGrid}>
          <article>
            <span className={styles.platformIcon}><Smartphone size={26} /></span>
            <div>
              <small>AVAILABLE NOW</small>
              <h3>Android</h3>
              <p>Material 3 기반 네이티브 화면과 기기 캘린더, 생체인증, 푸시 알림을 지원합니다.</p>
            </div>
          </article>
          <article>
            <span className={styles.platformIcon}><Globe2 size={26} /></span>
            <div>
              <small>AVAILABLE NOW</small>
              <h3>Web</h3>
              <p>설치 없이 PC와 모바일 브라우저에서 핵심 서비스를 이어서 사용할 수 있습니다.</p>
            </div>
          </article>
          <article className={styles.platformPending}>
            <span className={styles.platformIcon}></span>
            <div>
              <small>IN DEVELOPMENT</small>
              <h3>Apple</h3>
              <p>iPhone을 우선으로 네이티브 기능 정합성을 완성한 뒤 Apple 생태계로 확장합니다.</p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div>
          <span className={styles.sectionKicker}>START YOUR FLOW</span>
          <h2>오늘부터, 일상의 시차를 줄이세요.</h2>
          <p>혼자 시작하고 필요한 순간에 소중한 사람과 공간으로 연결할 수 있습니다.</p>
        </div>
        <div className={styles.ctaActions}>
          <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className={styles.primaryCta}>
            Android 앱 다운로드
            <ArrowRight size={18} />
          </a>
          <Link href="/login" className={styles.secondaryCta}>웹에서 시작</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <GleaumLogoImg size={34} />
          <GleaumBI variant="auto" width={102} />
        </div>
        <p>나, 그리고 연인/가족의 일상 네트워크</p>
        <div className={styles.footerLinks}>
          <Link href="/legal/terms">이용약관</Link>
          <Link href="/legal/privacy">개인정보처리방침</Link>
          <Link href="/download">다운로드</Link>
        </div>
        <small>© 2026 Gleaum. All rights reserved.</small>
      </footer>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={`${styles.sectionHeading} ${align === 'center' ? styles.center : ''}`}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function PhoneShell({
  variant,
  className = '',
}: {
  variant: 'home' | 'schedule' | 'space';
  className?: string;
}) {
  return (
    <div className={`${styles.phone} ${className}`}>
      <div className={styles.phoneHardware}>
        <span>9:41</span>
        <i />
        <span>● ◒</span>
      </div>
      <div className={styles.appBar}>
        <div className={styles.miniBrand}>
          <GleaumLogoImg size={22} />
          <GleaumBI variant="dark" width={62} />
        </div>
        <BellRing size={17} />
      </div>
      {variant === 'home' && <HomePreview />}
      {variant === 'schedule' && <SchedulePreview />}
      {variant === 'space' && <SpacePreview />}
      <div className={styles.previewNav}>
        <span className={variant === 'home' ? styles.active : ''}>⌂<small>홈</small></span>
        <span className={variant === 'schedule' ? styles.active : ''}>□<small>일정</small></span>
        <span className={variant === 'space' ? styles.active : ''}>◇<small>공간</small></span>
        <span>₩<small>가계부</small></span>
        <span>≡<small>전체</small></span>
      </div>
    </div>
  );
}

function HomePreview() {
  return (
    <div className={styles.previewBody}>
      <div className={styles.previewGreeting}>
        <small>좋은 하루예요</small>
        <strong>오늘의 흐름</strong>
        <p>개인 일정과 연결된 공간을 한눈에 확인하세요.</p>
        <div>
          <span><b>2</b>오늘 일정</span>
          <span><b>1</b>공유 일정</span>
          <span><b>0</b>놓친 일정</span>
        </div>
      </div>
      <div className={styles.previewSectionTitle}><strong>오늘</strong><span>전체 보기</span></div>
      <div className={styles.previewSchedule}>
        <i className={styles.blueDot} />
        <div><strong>주간 일정 정리</strong><small>오전 10:00 · 개인 일정</small></div>
        <span>예정</span>
      </div>
      <div className={styles.previewSchedule}>
        <i className={styles.tealDot} />
        <div><strong>가족 저녁 약속</strong><small>오후 7:00 · 가족 공간</small></div>
        <span>공유</span>
      </div>
      <div className={styles.previewQuick}>
        <div><CalendarDays size={18} /><span>새 일정</span></div>
        <div><CircleDollarSign size={18} /><span>가계부</span></div>
      </div>
    </div>
  );
}

function SchedulePreview() {
  return (
    <div className={styles.previewBody}>
      <div className={styles.previewTitle}>
        <div><small>이번 주</small><strong>나의 일정</strong></div>
        <button type="button">+</button>
      </div>
      <div className={styles.weekRow}>
        {['월', '화', '수', '목', '금'].map((day, index) => (
          <span className={index === 2 ? styles.selectedDay : ''} key={day}>
            <small>{day}</small>{21 + index}
          </span>
        ))}
      </div>
      <div className={styles.filterRow}><span>전체</span><span>개인</span><span>공유</span></div>
      <div className={styles.dateLabel}>5월 23일 수요일</div>
      <div className={styles.previewSchedule}>
        <i className={styles.blueDot} />
        <div><strong>프로젝트 점검</strong><small>오전 9:30 · 개인 일정</small></div>
        <span>예정</span>
      </div>
      <div className={styles.previewSchedule}>
        <i className={styles.tealDot} />
        <div><strong>주말 장보기</strong><small>오후 4:00 · 가족 공간</small></div>
        <span>공유</span>
      </div>
    </div>
  );
}

function SpacePreview() {
  return (
    <div className={styles.previewBody}>
      <div className={styles.spaceHero}>
        <div className={styles.spaceAvatar}>⌂</div>
        <div><small>FAMILY SPACE</small><strong>우리 가족</strong><p>4명이 함께하고 있어요</p></div>
      </div>
      <div className={styles.spaceTabs}><span>소식</span><span>일정</span><span>멤버</span></div>
      <div className={styles.spacePost}>
        <div className={styles.postAuthor}><i>G</i><div><strong>가족 멤버</strong><small>방금 전</small></div></div>
        <p>이번 주말 가족 일정 확인해 주세요. 함께 정하면 모두의 일정에 반영됩니다.</p>
        <span>댓글 2</span>
      </div>
      <div className={styles.spacePost}>
        <div className={styles.postAuthor}><i>M</i><div><strong>공간 지기</strong><small>어제</small></div></div>
        <p>공유할 내용과 일정은 이 공간에서 한 번에 확인할 수 있어요.</p>
      </div>
    </div>
  );
}
