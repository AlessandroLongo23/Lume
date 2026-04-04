import type { Metadata } from 'next';
import { JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { MessagePopupContainer } from '@/lib/components/shared/ui/messagePopup/MessagePopupContainer';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lume — Il gestionale per il tuo salone',
  description: 'Gestisci clienti, appuntamenti, magazzino e bilancio in un\'unica app chiara e veloce. Il software per parrucchieri che funziona davvero.',
  metadataBase: new URL('https://lume.vercel.app/'),
  openGraph: {
    title: 'Lume — Il gestionale per il tuo salone',
    description: 'Gestisci clienti, appuntamenti, magazzino e bilancio in un\'unica app chiara e veloce.',
    type: 'website',
    url: 'https://lume.vercel.app/',
    locale: 'it_IT',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={cn(jetbrainsMono.variable, "font-sans", geist.variable)}>
      <body>
        <ThemeProvider>
          {children}
          <MessagePopupContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
