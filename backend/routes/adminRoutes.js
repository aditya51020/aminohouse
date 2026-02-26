router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (email === 'admin@fuelbar.com' && password === 'admin123') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});