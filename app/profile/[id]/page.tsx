'use client';
import { useParams } from 'next/navigation';
import ProfileView from '@/components/ProfileView';

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>();
  return <ProfileView id={id} />;
}
