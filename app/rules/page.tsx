import { Metadata } from 'next';
import RulesPage from '../../components/pages/Rules/RulesPage';

export const metadata: Metadata = {
  title: 'Competition Rules - Pull-Up Club',
  description: 'Learn the official rules and guidelines for Pull-Up Club competitions. Understand scoring, submission requirements, and competition standards.',
};

export default function Rules() {
  return <RulesPage />;
}