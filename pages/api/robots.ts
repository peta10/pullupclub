import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const robots = `User-agent: *
Allow: /
Disallow: /admin-*
Disallow: /profile
Disallow: /submit
Disallow: /api/

Sitemap: https://pullupclub.com/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(robots);
}