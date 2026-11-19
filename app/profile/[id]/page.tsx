'use client';
import { notFound, useParams } from 'next/navigation';
import ProfileView from '@/components/ProfileView';
import { FEATURES } from '@/lib/features';
import { ME } from '@/lib/types';

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>();
  // Other people's profiles are part of the social layer. Your own profile lives at /profile.
  if (!FEATURES.social && id !== ME) notFound();
  return <ProfileView id={id} />;
}
