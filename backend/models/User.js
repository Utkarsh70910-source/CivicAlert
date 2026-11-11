/**
 * CivicAlert - User Mongoose Model
 * 
 * Manages citizens, field workers, and municipal admins in MongoDB.
 * Passwords are automatically hashed with bcrypt before saving.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Custom user ID for backwards compatibility with existing UI / routes (e.g. 'cit-1', 'w-101', 'admin-1')
    customId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: function () {
        return this.role === 'citizen' || this.role === 'admin';
      },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['citizen', 'worker', 'admin'],
      default: 'citizen',
      required: true,
      index: true,
    },
    // Worker specific fields
    workerId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: null,
    },
    specialization: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Virtual property for 'fullName' matching prompt specification
userSchema.virtual('fullName').get(function () {
  return this.name;
});

// Virtual property to expose 'id' matching either customId or _id string
userSchema.virtual('id').get(function () {
  return this.customId || this._id.toString();
});

// Hash password before saving if modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  // If password is not already a bcrypt hash (starts with $2a$ or $2b$)
  if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Method to verify candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  // If hashed with bcrypt
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
  // Fallback plain-text check during initial migration
  return candidatePassword === this.password;
};

// Method to return sanitized user object (never expose password)
userSchema.methods.toSanitized = function () {
  const obj = this.toObject ? this.toObject({ virtuals: true }) : { ...this };
  delete obj.password;
  obj.id = this.customId || (this._id ? this._id.toString() : obj.id);
  return obj;
};

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;

