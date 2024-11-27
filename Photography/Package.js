import mongoose from 'mongoose';

// models/Package.js
const PackageSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  });
  
  export default mongoose.model('Package', PackageSchema);