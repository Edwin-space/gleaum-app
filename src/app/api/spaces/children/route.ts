import { NextRequest, NextResponse } from 'next/server';
import {
  createFamilyDependentDraft,
  getFamilyDependents,
} from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import type { FamilyDependentGender, GuardianRelationshipType } from '@/types';

const GENDERS = new Set<FamilyDependentGender>(['male', 'female', 'other', 'undisclosed']);
const RELATIONSHIPS = new Set<GuardianRelationshipType>(['parent', 'guardian']);

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const spaceId = request.nextUrl.searchParams.get('spaceId')?.trim();
  if (!spaceId) {
    return NextResponse.json({ error: 'space_id_required' }, { status: 400 });
  }

  try {
    const dependents = await getFamilyDependents(spaceId, supabase);
    return NextResponse.json({ dependents });
  } catch (error) {
    console.error('[family/dependents][GET]', error);
    return NextResponse.json({ error: 'dependent_list_failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const spaceId = typeof body.spaceId === 'string' ? body.spaceId.trim() : '';
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const birthDate = typeof body.birthDate === 'string' ? body.birthDate.trim() : '';
  const expectedEmail = typeof body.expectedEmail === 'string'
    ? body.expectedEmail.trim().toLowerCase()
    : '';
  const gender = typeof body.gender === 'string' ? body.gender as FamilyDependentGender : undefined;
  const relationshipType = typeof body.relationshipType === 'string'
    ? body.relationshipType as GuardianRelationshipType
    : 'guardian';

  if (!spaceId || !displayName || displayName.length > 40 || !isIsoDate(birthDate)) {
    return NextResponse.json({ error: 'invalid_dependent_profile' }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(expectedEmail)) {
    return NextResponse.json({ error: 'invalid_expected_email' }, { status: 400 });
  }
  if ((gender && !GENDERS.has(gender)) || !RELATIONSHIPS.has(relationshipType)) {
    return NextResponse.json({ error: 'invalid_dependent_profile' }, { status: 400 });
  }

  try {
    const dependentId = await createFamilyDependentDraft({
      spaceId,
      displayName,
      birthDate,
      expectedEmail,
      gender,
      relationshipType,
    }, supabase);
    return NextResponse.json({
      dependentId,
      status: 'consent_pending',
      nextAction: 'guardian_verification',
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('[family/dependents][POST]', error);
    if (message.includes('family_space_admin_required')) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (message.includes('family_space_required')) {
      return NextResponse.json({ error: 'family_space_required' }, { status: 409 });
    }
    if (message.includes('duplicate key')) {
      return NextResponse.json({ error: 'expected_email_already_registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'dependent_create_failed' }, { status: 500 });
  }
}
