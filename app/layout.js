import { Orbitron, Nunito } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '600', '700', '800', '900'],
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata = {
  title: 'Akku ClipGen — Anime Video Clip Generator',
  description:
    'Upload any long video and instantly split it into equal-duration clips. Download each segment as MP4 or MP3 with one click. Powered by Akku ClipGen.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
