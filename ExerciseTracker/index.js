const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

require('dotenv').config();

// Use public DNS servers for MongoDB Atlas SRV lookups
dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

dns.setDefaultResultOrder('ipv4first');

const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  log: [{
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  }]
});

const User = mongoose.model('User', userSchema);

// 1. Create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = new User({ username: username.trim() });
    await user.save();

    res.json({
      username: user.username,
      _id: user._id
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username');

    res.json(users.map(user => ({
      username: user.username,
      _id: user._id
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Add an exercise to a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!description || !description.trim() ||
        duration === undefined || duration === '') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedDuration = Number(duration);

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    const exerciseDate = date ? new Date(date) : new Date();

    if (Number.isNaN(exerciseDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.log.push({
      description: description.trim(),
      duration: parsedDuration,
      date: exerciseDate
    });

    await user.save();

    res.json({
      username: user.username,
      description: description.trim(),
      duration: parsedDuration,
      date: exerciseDate.toDateString(),
      _id: user._id
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Get a user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let exercises = user.log.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date
    }));

    // Filter by starting date
    if (from) {
      const fromDate = new Date(from);

      if (Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: 'Invalid from date' });
      }

      fromDate.setHours(0, 0, 0, 0);

      exercises = exercises.filter(exercise =>
        exercise.date >= fromDate
      );
    }

    // Filter by ending date
    if (to) {
      const toDate = new Date(to);

      if (Number.isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid to date' });
      }

      toDate.setHours(23, 59, 59, 999);

      exercises = exercises.filter(exercise =>
        exercise.date <= toDate
      );
    }

    const count = exercises.length;

    // Apply limit
    if (limit !== undefined) {
      const parsedLimit = Number(limit);

      if (!Number.isInteger(parsedLimit) || parsedLimit < 0) {
        return res.status(400).json({ error: 'Invalid limit' });
      }

      exercises = exercises.slice(0, parsedLimit);
    }

    res.json({
      username: user.username,
      count: count,
      _id: user._id,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }))
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
