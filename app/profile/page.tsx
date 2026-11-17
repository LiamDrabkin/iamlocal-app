'use client';
import ProfileView from '@/components/ProfileView';
import { ME } from '@/lib/types';

export default function MyProfile() {
  return <ProfileView id={ME} />;
}
