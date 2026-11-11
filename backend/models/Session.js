/**
 * CivicAlert - Session Mongoose Model
 * 
 * Persists active user login sessions in MongoDB so users remain authenticated
 * across backend server restarts.
 * Sessions automatically expire after 7 days via MongoDB TTL index.
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Object,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '7d', // MongoDB TTL: automatically removes expired sessions after 7 days
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

module.exports = Session;

