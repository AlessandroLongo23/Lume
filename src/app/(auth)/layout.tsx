import { AuthShell } from '@/lib/components/auth/AuthCard';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
