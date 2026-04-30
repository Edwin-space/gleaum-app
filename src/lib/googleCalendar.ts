import { Schedule } from '@/types';

// ============================================================
// Google Calendar API 연동 유틸리티
// ============================================================

/**
 * Google Calendar API 요청을 위한 헬퍼 함수
 */
async function fetchGoogleCalendarAPI(endpoint: string, token: string, options: RequestInit = {}) {
  const baseUrl = 'https://www.googleapis.com/calendar/v3';
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Google Calendar API Error (${response.status}):`, errorText);
    throw new Error(`Google Calendar API failed: ${response.statusText}`);
  }

  // DELETE 요청 시에는 body가 없을 수 있음
  if (response.status === 204) return null;
  
  return response.json();
}

/**
 * 글리움 Schedule 객체를 Google Event 객체로 변환
 */
function toGoogleEventFormat(schedule: Schedule) {
  // allDay 일정이면 date 필드를 사용하고, 아니면 dateTime 필드를 사용
  const start = schedule.allDay 
    ? { date: schedule.startTime.toISOString().split('T')[0] }
    : { dateTime: schedule.startTime.toISOString() };
    
  const end = schedule.allDay
    ? { date: (schedule.endTime ?? schedule.startTime).toISOString().split('T')[0] }
    : { dateTime: (schedule.endTime ?? schedule.startTime).toISOString() };

  // 반복 일정(RRULE) 설정 (필요시 확장)
  let recurrence: string[] | undefined;
  if (schedule.repeat && schedule.repeat !== 'none') {
    const ruleMap: Record<string, string> = {
      daily: 'RRULE:FREQ=DAILY',
      weekly: 'RRULE:FREQ=WEEKLY',
      monthly: 'RRULE:FREQ=MONTHLY',
      yearly: 'RRULE:FREQ=YEARLY',
    };
    
    let rrule = ruleMap[schedule.repeat];
    if (rrule && schedule.repeatEndDate) {
      // 구글 캘린더 RRULE의 UNTIL은 기본적으로 UTC 포맷 사용 (YYYYMMDDTHHMMSSZ)
      const untilDate = schedule.repeatEndDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      rrule += `;UNTIL=${untilDate}`;
    }
    if (rrule) recurrence = [rrule];
  }

  return {
    summary: schedule.title,
    description: schedule.memo || '',
    location: schedule.location?.address || '',
    start,
    end,
    recurrence,
  };
}

/**
 * 새로운 이벤트를 구글 캘린더에 생성합니다.
 */
export async function createGoogleEvent(token: string, schedule: Schedule) {
  const eventBody = toGoogleEventFormat(schedule);
  return fetchGoogleCalendarAPI('/calendars/primary/events', token, {
    method: 'POST',
    body: JSON.stringify(eventBody),
  });
}

/**
 * 기존 구글 캘린더 이벤트를 수정합니다.
 */
export async function updateGoogleEvent(token: string, eventId: string, schedule: Schedule) {
  const eventBody = toGoogleEventFormat(schedule);
  return fetchGoogleCalendarAPI(`/calendars/primary/events/${eventId}`, token, {
    method: 'PUT',
    body: JSON.stringify(eventBody),
  });
}

/**
 * 기존 구글 캘린더 이벤트를 삭제합니다.
 */
export async function deleteGoogleEvent(token: string, eventId: string) {
  return fetchGoogleCalendarAPI(`/calendars/primary/events/${eventId}`, token, {
    method: 'DELETE',
  });
}

/**
 * 특정 기간 내의 구글 캘린더 이벤트를 조회합니다.
 */
export async function fetchGoogleEvents(token: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true', // 반복 일정을 개별 이벤트로 풀어서 응답
    orderBy: 'startTime',
  });
  
  return fetchGoogleCalendarAPI(`/calendars/primary/events?${params.toString()}`, token, {
    method: 'GET',
  });
}
