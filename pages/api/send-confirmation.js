import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const { to, name, propertyName, checkIn, checkOut } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'TruckNest <noreply@yourdomain.com>',
      to,
      subject: 'Booking Confirmation',
      html: `<p>Hi ${name},</p>
             <p>Your booking at <b>${propertyName}</b> is confirmed from <b>${checkIn}</b> to <b>${checkOut}</b>.</p>
             <p>Thank you for choosing TruckNest!</p>`
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
} 