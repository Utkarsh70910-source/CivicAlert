/**
 * CivicAlert - Complaint Mongoose Model
 * 
 * Manages citizen civic issue reports, field assignments, and resolution status.
 */

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    referenceId: {
      type: String,
      required: [true, 'Reference ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    photos: {
      type: [String],
      default: [],
    },
    photoPreview: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved'],
      default: 'Submitted',
      index: true,
    },
    // Citizen Ownership Link
    citizenId: {
      type: String,
      default: null,
      index: true,
    },
    citizenName: {
      type: String,
      trim: true,
      default: 'Anonymous Resident',
    },
    citizenPhone: {
      type: String,
      trim: true,
      default: null,
    },
    // Worker Assignment
    assignedWorkerId: {
      type: String,
      default: null,
      index: true,
    },
    assignedWorkerName: {
      type: String,
      default: null,
    },
    assignedWorkerPhone: {
      type: String,
      default: null,
    },
    // Timeline & Resolution
    expectedCompletionDate: {
      type: String, // Stored as ISO date string 'YYYY-MM-DD'
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: null,
    },
    resolutionPhoto: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Virtual property for 'id' matching customId or _id string
complaintSchema.virtual('id').get(function () {
  return this.customId || this._id.toString();
});

/**
 * Computes SLA metrics (daysRemaining, isOverdue) for a complaint
 */
complaintSchema.methods.enrich = function () {
  const plain = this.toObject ? this.toObject({ virtuals: true }) : { ...this };
  let daysRemaining = null;
  let isOverdue = false;

  if (plain.expectedCompletionDate && plain.status !== 'Resolved') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(plain.expectedCompletionDate);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
    isOverdue = daysRemaining < 0;
  }

  const photos = Array.isArray(plain.photos) && plain.photos.length > 0
    ? plain.photos
    : (plain.photoPreview ? [plain.photoPreview] : []);

  plain.id = this.customId || (this._id ? this._id.toString() : plain.id);
  plain.photos = photos;
  plain.photoPreview = photos[0] || plain.photoPreview || null;
  plain.daysRemaining = daysRemaining;
  plain.isOverdue = isOverdue;

  return plain;
};

/**
 * Sanitizes complaint for public reference ID tracking (omits citizen private identity)
 */
complaintSchema.methods.sanitizeForPublic = function () {
  const enriched = this.enrich();
  return {
    id: enriched.id,
    referenceId: enriched.referenceId,
    category: enriched.category,
    priority: enriched.priority || 'Medium',
    title: enriched.title || enriched.category,
    description: enriched.description,
    location: enriched.location,
    latitude: enriched.latitude !== undefined ? enriched.latitude : null,
    longitude: enriched.longitude !== undefined ? enriched.longitude : null,
    photos: enriched.photos || [],
    photoPreview: enriched.photoPreview || null,
    status: enriched.status,
    reportDate: enriched.createdAt,
    assignedWorkerName: enriched.assignedWorkerName || 'Not Assigned Yet',
    assignedWorkerContact: enriched.assignedWorkerPhone || null,
    expectedCompletionDate: enriched.expectedCompletionDate,
    daysRemaining: enriched.daysRemaining,
    isOverdue: enriched.isOverdue,
    resolutionNotes: enriched.status === 'Resolved' ? enriched.resolutionNotes : null,
  };
};

complaintSchema.set('toJSON', { virtuals: true });
complaintSchema.set('toObject', { virtuals: true });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;

