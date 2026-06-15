import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_ICONS,
  INCOME_CATEGORY_LABELS,
  INCOME_CATEGORY_ICONS,
  FIXED_EXPENSE_CATEGORIES,
  VARIABLE_EXPENSE_CATEGORIES,
  PERSONAL_INCOME_CATEGORIES,
  PAYMENT_METHOD_LABELS,
  type LedgerKind,
  type LedgerCategory,
  type ExpenseCategory,
  type IncomeCategory,
  type PaymentMethod,
  type RecurFreq,
} from '@/types';
import { getCategoryColor, getIncomeCategoryColor } from '@/lib/utils';

export { PAYMENT_METHOD_LABELS };

/** 카테고리 라벨 (수입/지출 공용) */
export function ledgerCatLabel(kind: LedgerKind, cat: LedgerCategory): string {
  return kind === 'income'
    ? (INCOME_CATEGORY_LABELS[cat as IncomeCategory] ?? '기타')
    : (EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? '기타');
}

/** 카테고리 아이콘 (수입/지출 공용) */
export function ledgerCatIcon(kind: LedgerKind, cat: LedgerCategory): string {
  return kind === 'income'
    ? (INCOME_CATEGORY_ICONS[cat as IncomeCategory] ?? '💰')
    : (EXPENSE_CATEGORY_ICONS[cat as ExpenseCategory] ?? '💳');
}

/** 카테고리 컬러 (수입/지출 공용) */
export function ledgerCatColor(kind: LedgerKind, cat: LedgerCategory): string {
  return kind === 'income'
    ? getIncomeCategoryColor(cat as IncomeCategory)
    : getCategoryColor(cat as ExpenseCategory);
}

export const PAYMENT_METHODS: PaymentMethod[] = ['card', 'auto', 'cash', 'other'];

export const RECUR_OPTIONS: { value: RecurFreq; label: string }[] = [
  { value: 'monthly', label: '매월' },
  { value: 'weekly',  label: '매주' },
  { value: 'yearly',  label: '매년' },
];

/** 추가/수정 모달의 카테고리 선택지 (kind + 지출의 고정/변동 구분) */
export function categoryOptions(kind: LedgerKind, expenseType: 'fixed' | 'variable'): LedgerCategory[] {
  if (kind === 'income') return PERSONAL_INCOME_CATEGORIES;
  return expenseType === 'fixed' ? FIXED_EXPENSE_CATEGORIES : VARIABLE_EXPENSE_CATEGORIES;
}

export function formatInputAmount(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
}

/** 로컬 날짜 문자열 (YYYY-MM-DD) */
export function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
