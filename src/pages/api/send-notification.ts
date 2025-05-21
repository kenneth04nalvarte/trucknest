import { Resend } from 'resend';
import { NextApiRequest, NextApiResponse } from 'next';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { to, subject, message } = req.body;
  try {
    const data = await resend.emails.send({
      from: 'TruckNest <noreply@trucknest.net>',
      to,
      subject,
      html: `<p>${message}</p>`
    });
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
} 