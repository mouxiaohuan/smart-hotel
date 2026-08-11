import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Smart Hotel Concierge', description: 'LangGraph 企业知识库问答助手' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
