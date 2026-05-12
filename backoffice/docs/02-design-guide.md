# 02. 백오피스 디자인 가이드 (Design Guide)

> 이 가이드는 백오피스 전용입니다. 기존 사용자 앱의 `DESIGN.md` 및 `docs/03-design-system.md`와는 별개로 운영됩니다.

---

## 1. 디자인 철학

백오피스는 **운영자의 생산성**을 최우선으로 합니다.
- ❌ 화려한 애니메이션, 그라디언트, 커스텀 색상 시스템 → 금지
- ✅ shadcn/ui 표준 스타일의 심플하고 일관된 흑백 톤 관리자 UI → 원칙

---

## 2. shadcn/ui 컴포넌트 사용 원칙 (반드시 읽을 것)

> ❗️ **배포 참사 사례**: shadcn/ui 컴포넌트가 설치되지 않은 상태에서 Tailwind 클래스로 디자인을 흔내내다 Vercel 배포 후 화면이 검게 나오거나 컴포넌트가 주저는 문제가 발생했습니다. **UI 코드를 작성하기 전, `components.json`이 존재하는지 반드시 확인하세요.**

### 컴포넌트 사용 방법

**항상 `src/components/ui/`에서 import하여 사용합니다.**

```tsx
// ✅ 올바른 방법 — shadcn 컴포넌트 import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

// ❌ 금지 — Tailwind로 shadcn 디자인을 직접 흔내내는 수동 작성
<button className="inline-flex items-center rounded-md bg-primary...">하지 마세요</button>
```

### 새 컴포넌트가 필요할 때

```bash
# backoffice/ 폴더에서 실행
npx shadcn@latest add [component-name] -y

# 예시
npx shadcn@latest add dialog -y
npx shadcn@latest add toast -y
```

### 현재 설치된 컴포넌트 (2026-05-12 기준)

| 컴포넌트 | 사용 화면 |
|-----------|----------|
| `Button` | 전체 |
| `Input` | 회원관리, 공간관리, CRM, 광고매니저, 설정 |
| `Label` | 전체 폼 |
| `Badge` | 회원관리(온보딩), CRM(변수) |
| `Table` | 회원관리, 공간관리 |
| `Tabs` | CRM(채널 선택) |
| `Select` | CRM(타겟), 광고매니저(라우팅, 위치) |
| `Textarea` | CRM(메시지 본문) |
| `Card` | 전체 섹션 컨테이너 |
| `Separator` | 폼 영역 구분 |
| `RadioGroup` | 광고매니저(방식 선택) |
| `Switch` | 설정 폼(토글스위치) |

---

## 3. 레이아웃 구조

```
RootLayout (layout.tsx)
├── <Sidebar />          ← 고정 좌측 사이드바 (w-64)
└── <main>               ← 우측 스크롤 가능한 메인 콘텐츠
     └── [각 page.tsx]   ← 개별 페이지 (사이드바 코드 절대 포함 금지)
```

**각 page.tsx는 `<main className="p-8">` 태그로 시작하고 끝냅니다.**
사이드바 코드를 page.tsx에 직접 작성하지 마세요. 오직 `components/Sidebar.tsx`만 사용합니다.

---

## 4. 사이드바 메뉴 추가 방법

`backoffice/src/components/Sidebar.tsx` 파일의 `links` 배열에만 추가합니다.

```tsx
const links = [
  { href: "/", label: "대시보드", icon: LayoutGrid },
  { href: "/users", label: "회원 및 공간 관리", icon: Users },
  // 여기에 새 메뉴 추가
  { href: "/new-page", label: "새 메뉴 이름", icon: SomeIcon },
];
```

---

## 5. 주요 컴포넌트 패턴 레퍼런스

### 페이지 헤더 (모든 페이지 공통)
```tsx
<header className="mb-8">
  <h1 className="text-3xl font-bold tracking-tight">페이지 제목</h1>
  <p className="text-muted-foreground mt-1">설명 텍스트</p>
</header>
```

### 데이터 테이블 (shadcn Table 컴포넌트)
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-base">제목</CardTitle>
    <Input placeholder="검색..." className="w-64" />
  </CardHeader>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>열 제목</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>데이터</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### 상태 배지
```tsx
<Badge>완료</Badge>              {/* 기본(dark) */}
<Badge variant="secondary">미완료</Badge>  {/* 회색 */}
<Badge variant="destructive">출시됨</Badge>  {/* 빨간색 */}
<Badge variant="outline">대기중</Badge>   {/* 테두리 */}
```

### Select 드롭다운
```tsx
<Select defaultValue="all">
  <SelectTrigger>
    <SelectValue placeholder="선택" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">전체</SelectItem>
  </SelectContent>
</Select>
```

### RadioGroup (광고 매니저 전략 선택 등)
```tsx
<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="opt1" id="opt1" />
    <Label htmlFor="opt1">옵션 1</Label>
  </div>
</RadioGroup>
```

---

## 6. 모바일 대응

백오피스는 기본적으로 **PC 화면(1280px 이상) 운영 환경을 기준**으로 합니다.
최소한의 반응형(`md:` 중단점)만 적용하며, 모바일 최적화는 우선순위가 낮습니다.
