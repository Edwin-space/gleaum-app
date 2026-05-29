// ── 광고 시스템 타입 ─────────────────────────────────────────────────────────

export interface AdSlotDef {
  id:          string;
  description: string;
  width:       number;
  height:      number;
  is_active:   boolean;
}

export interface Ad {
  id:            string;
  slot_id:       string;
  title:         string;
  description:   string | null;
  image_url:     string | null;
  link_url:      string;
  cta_text:      string;
  is_active:     boolean;
  priority:      number;
  starts_at:     string;
  ends_at:       string | null;
  budget_type:   'cpc' | 'cpm' | 'flat' | null;
  budget_amount: number | null;
  advertiser:    string | null;
  platforms:     ('web' | 'android' | 'ios')[];
  created_by:    string | null;
  created_at:    string;
  updated_at:    string;
}

/** 관리자 화면용 — 성과 통계 포함 */
export interface AdWithStats extends Ad {
  impressions: number;
  clicks:      number;
  ctr_pct:     number;
}

/** 공개 API 응답 — 최소 필드 */
export interface ActiveAd {
  id:          string;
  title:       string;
  description: string | null;
  image_url:   string | null;
  link_url:    string;
  cta_text:    string;
}

export type AdEventType = 'impression' | 'click';
export type AdPlatform  = 'web' | 'android' | 'ios';
