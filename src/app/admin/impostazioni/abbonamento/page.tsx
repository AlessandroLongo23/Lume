import { redirect } from 'next/navigation';

// The canonical billing surface lives at /admin/subscribe (plan, next charge,
// invoices, change/cancel). Keep the settings-sidebar entry working by
// redirecting here.
export default function AbbonamentoSettingsPage() {
  redirect('/admin/subscribe');
}
