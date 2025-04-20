const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = []; // In-memory user store for demo; replace with DB in production

// Register
router.post('/register', async (req, res) => {
  const { email, password, fullName, bio } = req.body;
  if (!email || !password || !fullName) return res.status(400).json({ error: 'Missing required fields' });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, email, password: hashed, fullName, bio };
  users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, bio: user.bio } });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, bio: user.bio } });
});

// Session check (optional)
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret');
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, bio: user.bio } });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;