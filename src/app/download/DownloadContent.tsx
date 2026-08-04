import Image from 'next/image';
import Link from 'next/link';
import {
  Apple,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { GleaumBI, GleaumLogoImg } from '@/components/ui/GleaumLogo';
import { AppStoreBadgeButton, GooglePlayBadgeButton } from '@/components/ui/OfficialStoreBadges';
import type { DownloadPlatform } from './DownloadPageClient';
import styles from './Download.module.css';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gleaum.app';
const APP_STORE_URL = 'https://apps.apple.com/kr/app/id6795727692';

const BENEFITS = [
  {
    icon: CalendarDays,
    title: '내 일정과 함께하는 일정',
    description: '개인 일정은 나만 보고, 함께할 일정은 관계별 공간에서 나눠요.',
  },
  {
    icon: UsersRound,
    title: '관계마다 독립적인 공간',
    description: '연인, 가족, 모임의 일정과 소식을 서로 섞이지 않게 연결해요.',
  },
  {
    icon: WalletCards,
    title: '한눈에 보는 자금 흐름',
    description: '수입과 지출, 정기 항목을 기록하고 월별 흐름을 놓치지 않아요.',
  },
];

const INSTALL_STEPS = [
  ['01', '앱 설치', '사용 중인 기기에 맞는 스토어에서 글리움을 받아요.'],
  ['02', '간편 로그인', 'Apple 또는 Google 계정으로 안전하게 시작해요.'],
  ['03', '내 흐름 만들기', '혼자 시작하고, 필요한 순간에 소중한 사람을 공간으로 초대해요.'],
] as const;

type DownloadContentProps = {
  compact?: boolean;
  platform: DownloadPlatform;
};

export function DownloadContent({ compact = false, platform }: DownloadContentProps) {
  const recommendedStore = platform === 'android' ? 'android' : platform === 'ios' ? 'ios' : null;
  const recommendedUrl = recommendedStore === 'android' ? PLAY_STORE_URL : recommendedStore === 'ios' ? APP_STORE_URL : null;
  const recommendedLabel = recommendedStore === 'android' ? 'Google Play에서 받기' : 'App Store에서 받기';

  return (
    <main className={`${styles.page} ${compact ? styles.compact : ''}`}>
      <div className={styles.ambientTop} aria-hidden="true" />
      <div className={styles.ambientBottom} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="글리움 홈">
          <GleaumLogoImg size={34} />
          <GleaumBI variant="auto" width={106} />
        </Link>
        <nav className={styles.nav} aria-label="다운로드 페이지 메뉴">
          <Link href="/features">기능 안내</Link>
          <Link href="/support">고객지원</Link>
        </nav>
        <Link href="/" className={styles.backLink}>서비스 소개</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}><Sparkles size={15} /> GLEAUM FOR MOBILE</span>
          <h1>가장 가까운 사람과<br /><em>일상을 연결하세요.</em></h1>
          <p>
            개인 일정과 가계부는 온전히 나답게,<br className={styles.desktopBreak} />
            함께할 시간과 소식은 관계별 공간에서 선명하게.
          </p>

          <div className={styles.heroActions}>
            {recommendedUrl ? (
              <a className={styles.primaryAction} href={recommendedUrl} target="_blank" rel="noreferrer">
                <Download size={18} />
                {recommendedLabel}
              </a>
            ) : (
              <a className={styles.primaryAction} href="#stores">
                내 기기에 맞는 앱 받기
                <ArrowRight size={18} />
              </a>
            )}
            {recommendedStore ? (
              <a className={styles.secondaryAction} href="gleaum://home">이미 설치했다면 앱 열기</a>
            ) : (
              <Link className={styles.secondaryAction} href="/features">기능 먼저 살펴보기</Link>
            )}
          </div>

          <div className={styles.trustRow} aria-label="글리움 앱 특징">
            <span><Check size={15} /> 무료로 시작</span>
            <span><Check size={15} /> Android·iPhone 지원</span>
            <span><Check size={15} /> 개인·공간 데이터 분리</span>
          </div>
        </div>

        <AppPreview compact={compact} />
      </section>

      <section className={styles.storeSection} id="stores">
        <div className={styles.sectionHeading}>
          <span>DOWNLOAD GLEAUM</span>
          <h2>사용 중인 기기에서 바로 시작하세요.</h2>
          <p>모든 핵심 기능은 Android와 iPhone 앱에서 제공됩니다.</p>
        </div>
        <div className={styles.storeGrid}>
          <StoreCard
            platform="android"
            href={PLAY_STORE_URL}
            recommended={recommendedStore === 'android'}
          />
          <StoreCard
            platform="ios"
            href={APP_STORE_URL}
            recommended={recommendedStore === 'ios'}
          />
        </div>
      </section>

      <section className={styles.benefitSection}>
        <div className={styles.sectionHeading}>
          <span>CONNECTED, NOT COMPLICATED</span>
          <h2>함께 쓰지만, 뒤섞이지 않도록.</h2>
        </div>
        <div className={styles.benefitGrid}>
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <article className={styles.benefitCard} key={title}>
              <span className={styles.benefitIcon}><Icon size={23} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.startSection}>
        <div className={styles.startCopy}>
          <span>START IN THREE STEPS</span>
          <h2>설치부터 연결까지,<br />복잡하지 않게.</h2>
          <p>처음에는 혼자 시작해도 괜찮아요. 필요한 순간에만 공간을 만들고 사람을 초대할 수 있습니다.</p>
          <div className={styles.securityNote}>
            <ShieldCheck size={20} />
            <span><strong>내 정보는 기본적으로 나에게만.</strong> 사용자가 선택한 공간의 정보만 구성원과 공유됩니다.</span>
          </div>
        </div>
        <ol className={styles.stepList}>
          {INSTALL_STEPS.map(([index, title, description]) => (
            <li key={index}>
              <span>{index}</span>
              <div><strong>{title}</strong><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span>READY WHEN YOU ARE</span>
          <h2>오늘의 흐름을<br />글리움에서 시작하세요.</h2>
        </div>
        <div className={styles.finalActions}>
          <GooglePlayBadgeButton href={PLAY_STORE_URL} height={46} />
          <AppStoreBadgeButton href={APP_STORE_URL} height={46} />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <GleaumLogoImg size={32} />
          <GleaumBI variant="auto" width={98} />
        </div>
        <p>나, 그리고 소중한 사람들의 일상 네트워크</p>
        <div className={styles.footerLinks}>
          <Link href="/features">기능 안내</Link>
          <Link href="/support">고객지원</Link>
          <Link href="/legal/terms">이용약관</Link>
          <Link href="/legal/privacy">개인정보처리방침</Link>
        </div>
        <small>© 2026 Gleaum. All rights reserved.</small>
      </footer>
    </main>
  );
}

function AppPreview({ compact }: { compact: boolean }) {
  return (
    <div className={styles.preview} aria-label="Android와 iPhone에서 실행 중인 실제 글리움 화면">
      <div className={styles.previewOrbit} aria-hidden="true" />
      <figure className={`${styles.device} ${styles.androidDevice}`}>
        <span className={styles.deviceLabel}>ANDROID</span>
        <Image
          src="/features/android-home.png"
          alt="글리움 Android 홈 화면"
          width={1080}
          height={1920}
          sizes={compact ? '60vw' : '280px'}
          preload
        />
      </figure>
      <figure className={`${styles.device} ${styles.iosDevice}`}>
        <span className={styles.deviceLabel}>iPHONE</span>
        <Image
          src="/features/ios-schedule.png"
          alt="글리움 iPhone 일정 화면"
          width={1320}
          height={2868}
          sizes={compact ? '56vw' : '250px'}
        />
      </figure>
      <div className={styles.previewNote}>
        <span><Sparkles size={16} /></span>
        <div><strong>같은 흐름, 각 기기에 맞는 경험</strong><small>Android · iPhone 네이티브 지원</small></div>
      </div>
    </div>
  );
}

function StoreCard({
  platform,
  href,
  recommended,
}: {
  platform: 'android' | 'ios';
  href: string;
  recommended: boolean;
}) {
  const isAndroid = platform === 'android';

  return (
    <a
      className={`${styles.storeCard} ${recommended ? styles.recommended : ''}`}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${isAndroid ? 'Google Play' : 'App Store'}에서 글리움 다운로드`}
    >
      {recommended ? <span className={styles.recommendBadge}>이 기기에 추천</span> : null}
      <span className={`${styles.storeIcon} ${isAndroid ? styles.playIcon : styles.appleIcon}`}>
        {isAndroid ? <PlayStoreMark /> : <Apple size={30} />}
      </span>
      <div className={styles.storeCopy}>
        <small>{isAndroid ? 'GET IT ON' : 'DOWNLOAD ON THE'}</small>
        <strong>{isAndroid ? 'Google Play' : 'App Store'}</strong>
        <p>{isAndroid ? 'Android 휴대전화에서 만나보세요.' : 'iPhone에서 글리움을 시작하세요.'}</p>
      </div>
      <ChevronRight className={styles.storeArrow} size={21} />
    </a>
  );
}

function PlayStoreMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M6 3.5 20.5 18 6 32.5V3.5Z" fill="#00C853" />
      <path d="M6 3.5 25.5 13l-5 5L6 3.5Z" fill="#FFD600" />
      <path d="M6 32.5 20.5 18l5 5L6 32.5Z" fill="#F44336" />
      <path d="m25.5 13 4.5 2.5c1.4.8 1.4 4.2 0 5L25.5 23l-5-5 5-5Z" fill="#448AFF" />
    </svg>
  );
}
