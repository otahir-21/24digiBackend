const mongoose = require('mongoose');
const {
  HEALTH_CONSIDERATIONS,
  FOOD_ALLERGIES,
  PREFERRED_WORKOUTS,
  DAYS,
  GENDERS,
  DIETARY_GOALS,
  ACTIVITY_LEVELS,
  PRIMARY_GOALS,
  CURRENT_BUILDS,
  LOGIN_METHODS,
} = require('../utils/enums');

const consentsSchema = new mongoose.Schema(
  {
    termsAccepted: { type: Boolean, default: false },
    privacyAccepted: { type: Boolean, default: false },
    healthDisclaimerAccepted: { type: Boolean, default: false },
    acceptedAt: { type: Date },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, sparse: true, unique: true, trim: true },
    email: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
    loginMethod: { type: String, enum: LOGIN_METHODS, required: true },
    name: { type: String, trim: true },
    dateOfBirth: { type: Date },
    heightCm: { type: Number },
    weightKg: { type: Number },
    gender: { type: String, enum: GENDERS },
    healthConsiderations: {
      type: [String],
      enum: HEALTH_CONSIDERATIONS,
      default: [],
    },
    foodAllergies: {
      type: [String],
      enum: FOOD_ALLERGIES,
      default: [],
    },
    otherAllergyText: { type: String, trim: true },
    dietaryGoal: { type: String, enum: DIETARY_GOALS },
    activityLevel: { type: String, enum: ACTIVITY_LEVELS },
    preferredWorkouts: {
      type: [String],
      enum: PREFERRED_WORKOUTS,
      default: [],
    },
    workoutsPerWeek: { type: Number, min: 0, max: 7 },
    daysOff: {
      type: [String],
      enum: DAYS,
      default: [],
    },
    timezone: { type: String, trim: true },
    primaryGoal: { type: String, enum: PRIMARY_GOALS },
    currentBuild: { type: String, enum: CURRENT_BUILDS },
    consents: { type: consentsSchema, default: () => ({}) },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
