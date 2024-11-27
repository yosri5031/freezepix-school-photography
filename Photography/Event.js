import mongoose from 'mongoose';

// models/Event.js
const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  schoolId: {
    type: String,
    ref: 'School'
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('Event', EventSchema);