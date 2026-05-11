import { redirect } from 'next/navigation';

/** /family는 /space로 영구 리디렉션 */
export default function FamilyPage() {
  redirect('/space');
}
