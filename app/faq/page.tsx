import { Metadata } from 'next';
import FAQPage from '../../components/pages/FAQ/FAQPage';

export const metadata: Metadata = {
  title: 'FAQ - Pull-Up Club',
  description: 'Frequently asked questions about Pull-Up Club competitions, subscriptions, rules, and more.',
};

export default function FAQ() {
  return <FAQPage />;
}