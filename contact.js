// routes/contact.js — Contact form: save to DB + send email
const express    = require('express');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const db         = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── Email transporter ──
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────────────
// POST /api/contact — Submit contact form
// ─────────────────────────────────────────
router.post('/', [
  body('first_name').trim().notEmpty().withMessage('First name required'),
  body('last_name').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message too short'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { first_name, last_name, email, service, message } = req.body;

  // Save to database
  db.run(
    'INSERT INTO messages (first_name, last_name, email, service, message) VALUES (?, ?, ?, ?, ?)',
    [first_name, last_name, email, service || null, message],
    async function (err) {
      if (err) return res.status(500).json({ error: 'Could not save message' });

      const msgId = this.lastID;

      // Send email notification
      try {
        await transporter.sendMail({
          from: `"MyBrand Website" <${process.env.EMAIL_USER}>`,
          to:   process.env.EMAIL_TO,
          subject: `New Contact: ${first_name} ${last_name} — ${service || 'General'}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px">
              <h2 style="color:#c8f04a;background:#0b0c0e;padding:1rem;border-radius:8px">
                New Contact Message #${msgId}
              </h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;color:#666">Name</td>
                    <td style="padding:8px"><strong>${first_name} ${last_name}</strong></td></tr>
                <tr style="background:#f9f9f9">
                    <td style="padding:8px;color:#666">Email</td>
                    <td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:8px;color:#666">Service</td>
                    <td style="padding:8px">${service || '—'}</td></tr>
                <tr style="background:#f9f9f9">
                    <td style="padding:8px;color:#666;vertical-align:top">Message</td>
                    <td style="padding:8px">${message.replace(/\n/g, '<br>')}</td></tr>
              </table>
            </div>
          `,
        });

        // Auto-reply to sender
        await transporter.sendMail({
          from: `"MyBrand" <${process.env.EMAIL_USER}>`,
          to:   email,
          subject: 'We received your message — MyBrand',
          html: `
            <div style="font-family:sans-serif;max-width:600px">
              <h2>Hi ${first_name}, thanks for reaching out! 👋</h2>
              <p>We've received your message and will get back to you within <strong>24 hours</strong>.</p>
              <p style="color:#666">Here's what you sent:</p>
              <blockquote style="border-left:3px solid #c8f04a;padding-left:1rem;color:#444">
                ${message.replace(/\n/g, '<br>')}
              </blockquote>
              <p>— The MyBrand Team</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Email error:', emailErr.message);
        // Still respond OK — message was saved to DB
      }

      res.status(201).json({
        message: 'Message received! We\'ll be in touch soon.',
        id: msgId
      });
    }
  );
});

// ─────────────────────────────────────────
// GET /api/contact — List all messages (admin only)
// ─────────────────────────────────────────
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admins only' });
  }

  db.all(
    'SELECT * FROM messages ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ messages: rows, total: rows.length });
    }
  );
});

// ─────────────────────────────────────────
// PATCH /api/contact/:id/read — Mark as read
// ─────────────────────────────────────────
router.patch('/:id/read', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

  db.run('UPDATE messages SET is_read = 1 WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Marked as read' });
  });
});

module.exports = router;
