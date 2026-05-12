import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * GA4 Data API 클라이언트 (서버 사이드 전용)
 *
 * 필요 환경변수:
 *   GA4_PROPERTY_ID         — GA4 속성 ID (숫자, 예: "123456789")
 *   GOOGLE_SERVICE_ACCOUNT  — 서비스 계정 JSON 전체 내용 (문자열로 저장)
 */

export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID ?? "";

function getClient(): BetaAnalyticsDataClient | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw || !GA4_PROPERTY_ID) return null;

  try {
    const credentials = JSON.parse(raw);
    return new BetaAnalyticsDataClient({ credentials });
  } catch {
    console.error("[GA4] 서비스 계정 JSON 파싱 실패");
    return null;
  }
}

export interface GA4Summary {
  activeUsers7d:   number;
  newUsers7d:      number;
  sessions7d:      number;
  pageViews7d:     number;
  realtimeUsers:   number;
  topPages:        { page: string; views: number }[];
}

export async function fetchGA4Summary(): Promise<GA4Summary | null> {
  const client = getClient();
  if (!client) return null;

  const property = `properties/${GA4_PROPERTY_ID}`;

  try {
    // 7일 리포트 + 실시간 동시 요청
    const [reportRes, realtimeRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
      client.runRealtimeReport({
        property,
        metrics: [{ name: "activeUsers" }],
      }),
    ]);

    // 7일 집계
    const row     = reportRes[0]?.rows?.[0]?.metricValues ?? [];
    const active7 = parseInt(row[0]?.value ?? "0", 10);
    const newU    = parseInt(row[1]?.value ?? "0", 10);
    const sess    = parseInt(row[2]?.value ?? "0", 10);
    const pv      = parseInt(row[3]?.value ?? "0", 10);

    // 실시간
    const rtRow      = realtimeRes[0]?.rows?.[0]?.metricValues ?? [];
    const realtimeU  = parseInt(rtRow[0]?.value ?? "0", 10);

    // 상위 페이지 (별도 요청)
    const pagesRes = await client.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics:    [{ name: "screenPageViews" }],
      orderBys:   [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit:      5,
    });

    const topPages = (pagesRes[0]?.rows ?? []).map((r) => ({
      page:  r.dimensionValues?.[0]?.value ?? "/",
      views: parseInt(r.metricValues?.[0]?.value ?? "0", 10),
    }));

    return { activeUsers7d: active7, newUsers7d: newU, sessions7d: sess, pageViews7d: pv, realtimeUsers: realtimeU, topPages };
  } catch (err) {
    console.error("[GA4] 데이터 조회 실패:", err);
    return null;
  }
}
