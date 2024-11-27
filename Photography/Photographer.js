import mongoose from 'mongoose';

// models/Photographer.js
const PhotographerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const Photographer = mongoose.models.Photographer || mongoose.model('Photographer', PhotographerSchema );

export default Photographer;
