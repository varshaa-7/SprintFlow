import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'IssueFlow — Multi-Tenant Issue Tracker',
  description: 'Track issues across your organization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0a0a0f] text-white antialiased" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
