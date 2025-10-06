import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Footer, Header } from '@/features/components';
import ReactQueryProvider from './react-query-provider';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TicketFlow',
  description: 'Venda de ingressos com Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        <ReactQueryProvider>{children}</ReactQueryProvider> 
      </body>
      <footer>
        <Footer />
      </footer>
    </html>
  );
}
