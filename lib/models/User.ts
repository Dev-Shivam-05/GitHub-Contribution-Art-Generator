import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  totalGenerations: {
    type: Number,
    default: 0,
  },
  credits: {
    type: Number,
    default: 1,
  },
  accessRequested: {
    type: Boolean,
    default: false,
  },
  history: [
    {
      repoName: String,
      timestamp: Date,
      patternType: String,
    },
  ],
}, { timestamps: true });

// Prevent overwrite of the model if it already compiles
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
