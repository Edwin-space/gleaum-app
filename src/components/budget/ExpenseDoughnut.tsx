'use client';

import { useMemo } from 'react';
import { getCategoryColor } from '@/lib/utils';
import { ExpenseCategory } from '@/types';

interface ExpenseDoughnutProps {
  categories: [string, number][];
  total: number;
  /** 카테고리 컬러 함수 (수입 차트는 수입 색상을 넘김). 미지정 시 지출 색상. */
  colorOf?: (cat: string) => string;
}

export function ExpenseDoughnut({ categories, total, colorOf }: ExpenseDoughnutProps) {
  const size = 200;
  const strokeWidth = 24;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const chartData = useMemo(() => {
    const resolveColor = colorOf ?? ((c: string) => getCategoryColor(c as ExpenseCategory));
    let currentOffset = 0;
    return categories.map(([cat, amt]) => {
      const percentage = (amt / total) * 100;
      const strokeDasharray = `${(percentage * circumference) / 100} ${circumference}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += (percentage * circumference) / 100;

      return {
        category: cat as ExpenseCategory,
        amount: amt,
        percentage,
        strokeDasharray,
        strokeDashoffset,
        color: resolveColor(cat),
      };
    });
  }, [categories, total, circumference, colorOf]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* 배경 원 */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="rgba(0,132,204,0.05)"
          strokeWidth={strokeWidth}
        />
        {chartData.map((item, i) => (
          <circle
            key={item.category}
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={item.strokeDasharray}
            strokeDashoffset={item.strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ 
              transitionDelay: `${i * 100}ms`,
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.05))'
            }}
          />
        ))}
      </svg>

      {/* 중앙 요약 정보 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-40">Total</span>
        <span className="text-[20px] font-bold leading-tight">
          {Math.round(total / 10000).toLocaleString()}
          <span className="text-[13px] ml-0.5">만</span>
        </span>
      </div>
    </div>
  );
}
