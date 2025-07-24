import './globals.css';
import type { Metadata } from 'next';

// const inter = Inter({ subsets: ['latin'] });
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Object Remover - Remove Unwanted Objects from Images',
  description: 'Professional AI-powered image editing tool to remove unwanted objects from photos with precision and ease.',
  keywords: ['AI', 'image editing', 'object removal', 'photo editing', 'remove objects'],
  authors: [{ name: 'AI Object Remover Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body >
        {children}
      </body>
    </html>
  );
}