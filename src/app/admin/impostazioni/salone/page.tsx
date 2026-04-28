import { redirect } from 'next/navigation';

export default function SaloneIndexPage() {
  redirect('/admin/impostazioni/salone/anagrafica');
}
