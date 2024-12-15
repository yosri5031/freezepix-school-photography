// models/Registration.js
import mongoose from 'mongoose';

// models/Registration.js
const RegistrationSchema = new mongoose.Schema({
  parentFirstName: {
    type: String,
    required: true
  },
  parentLastName: {
    type: String,
    required: true
  },
  parentEmail: {
    type: String,
    required: true
  },
  studentFirstName: {
    type: String,
    required: true
  },
  studentLastName: {
    type: String,
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit', 'interac','Daycare'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['payment_pending', 'completed', 'failed_payment','open','picture_uploaded','picture_sent','cancled','archived'],
    default: 'payment_pending'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'TND']
  }
});

export default mongoose.model('Registration', RegistrationSchema);
