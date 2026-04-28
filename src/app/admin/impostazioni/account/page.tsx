import { redirect } from 'next/navigation';

export default function AccountIndexPage() {
  redirect('/admin/impostazioni/account/sicurezza');
}
