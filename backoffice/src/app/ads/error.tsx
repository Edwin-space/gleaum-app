'use client';

export default function AdsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-lg font-bold text-destructive">광고 페이지 오류</h2>
      <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
        {error.message}
        {'\n'}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-white rounded text-sm"
      >
        다시 시도
      </button>
    </div>
  );
}
