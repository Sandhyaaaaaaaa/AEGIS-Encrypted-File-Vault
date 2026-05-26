import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit new feedback
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newFeedback = new Feedback({
      name,
      email,
      message
    });

    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback Error:', error);
    res.status(500).json({ message: 'Server error while submitting feedback' });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedback (Admin only - ideally would have auth middleware)
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error('Fetch Feedback Error:', error);
    res.status(500).json({ message: 'Server error while fetching feedback' });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (Admin only)
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete Feedback Error:', error);
    res.status(500).json({ message: 'Server error while deleting feedback' });
  }
});

export default router;
