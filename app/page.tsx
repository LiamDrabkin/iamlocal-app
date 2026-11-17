import { redirect } from 'next/navigation';

/** The mock opens on the welcome screen. */
export default function Home() {
  redirect('/welcome');
}
