import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reading Inference | Drew Kringel',
  description: 'Educational reading inference application',
};

export default function ReadingAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 