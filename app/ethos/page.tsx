import React from 'react';
import { Metadata } from 'next';
import EthosPage from '../../components/pages/EthosPage';

export const metadata: Metadata = {
  title: 'Our Ethos | Pull-Up Club',
  description: 'Learn about the legend behind our mission. Every rep is a rescue. Every member is a hero. This is the ethos of the Pull-Up Club.',
  openGraph: {
    title: 'Our Ethos | Pull-Up Club',
    description: 'Learn about the legend behind our mission. Every rep is a rescue. Every member is a hero.',
    images: ['/NewWebp-Pics/TheLegendofAlkeios-min.webp'],
  },
};

export default function Ethos() {
  return <EthosPage />;
}