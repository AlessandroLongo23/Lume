import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { MessagePopupContainer } from '@/lib/components/shared/ui/messagePopup/MessagePopupContainer';

export const metadata: Metadata = {
  title: 'Lume',
  description: 'Parrucchieri Consulenti di immagine',
  metadataBase: new URL('https://lume.vercel.app/'),
  openGraph: {
    title: 'Lume',
    description: 'Parrucchieri Consulenti di immagine',
    type: 'website',
    url: 'https://lume.vercel.app/',
    images: ['/brand/raster/4000w/logo-black.jpg'],
    locale: 'it_IT',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        <ThemeProvider>
          {children}
          <MessagePopupContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
