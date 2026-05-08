// routes/users.js — User management (admin)
const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// ─────────────────────────────────────────
// GET /api/users — list all users (admin)
// ─────────────────────────────────────────
router.get('/', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

  db.all(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ users: rows, total: rows.length });
    }
  );
});

// ─────────────────────────────────────────
// PUT /api/users/profile — update own profile
// ─────────────────────────────────────────
router.put('/profile', async (req, res) => {
  const { name, password } = req.body;
  const updates = [];
  const values  = [];

  if (name) { updates.push('name = ?'); values.push(name.trim()); }
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password min 6 chars' });
    const hashed = await bcrypt.hash(password, 12);
    updates.push('password = ?');
    values.push(hashed);
  }

  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  values.push(req.user.id);
  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function (err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// ─────────────────────────────────────────
// DELETE /api/users/:id — delete user (admin)
// ─────────────────────────────────────────
router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  });
});

module.exports = router;
