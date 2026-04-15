const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { read, write } = require('../db');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const db = read();
  if (db.users.find((u) => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const hash = await bcrypt.hash(password, 12);
  const user = { id: Date.now().toString(), username, password: hash, createdAt: new Date().toISOString() };
  db.users.push(user);
  write(db);
  res.status(201).json({ message: 'User created', username });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const db = read();
  const user = db.users.find((u) => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.json({ token, username: user.username, expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
});

module.exports = router;
