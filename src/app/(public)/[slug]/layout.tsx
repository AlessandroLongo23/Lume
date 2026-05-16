import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadPublicSalon } from '@/lib/gateway/loadPublicSalon';
import { getBrandStyleCSS } from '@/lib/utils/brand-style';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const salon = await loadPublicSalon(slug);
  if (!salon) return { title: 'Prenotazione · Lume' };

  return {
    title: `${salon.name} · Prenota online`,
    description: `Prenota online da ${salon.name}.`,
    icons: salon.favicon_url ? { icon: salon.favicon_url } : undefined,
  };
}

export default async function PublicSalonLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const salon = await loadPublicSalon(slug);
  if (!salon) notFound();

  const brandStyle = getBrandStyleCSS(salon.brand_color);

  return (
    <>
      {brandStyle && <style dangerouslySetInnerHTML={{ __html: brandStyle }} />}
      {children}
    </>
  );
}
