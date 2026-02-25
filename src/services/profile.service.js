const User = require('../models/User');
const { NotFoundError, ValidationError } = require('../utils/errors');

function ageFromDob(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function bmi(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function toBasic(body) {
  return {
    name: body.name,
    dateOfBirth: body.date_of_birth ? new Date(body.date_of_birth) : undefined,
    heightCm: body.height_cm,
    weightKg: body.weight_kg,
    gender: body.gender,
  };
}

function toHealth(body) {
  return { healthConsiderations: body.health_considerations };
}

function toNutrition(body) {
  return {
    foodAllergies: body.food_allergies,
    otherAllergyText: body.other_allergy_text,
    dietaryGoal: body.dietary_goal,
  };
}

function toActivity(body) {
  return {
    activityLevel: body.activity_level,
    preferredWorkouts: body.preferred_workouts,
    workoutsPerWeek: body.workouts_per_week,
    daysOff: body.days_off,
    timezone: body.timezone,
  };
}

function toGoals(body) {
  return {
    primaryGoal: body.primary_goal,
    currentBuild: body.current_build,
  };
}

async function getProfile(userId) {
  const user = await User.findById(userId).lean().exec();
  if (!user) throw new NotFoundError('User not found');
  const age = ageFromDob(user.dateOfBirth);
  const bmiVal = bmi(user.heightCm, user.weightKg);
  return {
    name: user.name,
    date_of_birth: user.dateOfBirth
      ? user.dateOfBirth.toISOString().slice(0, 10)
      : null,
    age: age ?? null,
    gender: user.gender,
    height_cm: user.heightCm,
    weight_kg: user.weightKg,
    bmi: bmiVal,
    primary_goal: user.primaryGoal,
    dietary_goal: user.dietaryGoal,
    food_allergies: user.foodAllergies,
    other_allergy_text: user.otherAllergyText,
    activity_level: user.activityLevel,
    preferred_workouts: user.preferredWorkouts,
    workouts_per_week: user.workoutsPerWeek,
    days_off: user.daysOff,
    timezone: user.timezone,
    current_build: user.currentBuild,
    health_considerations: user.healthConsiderations,
    is_profile_complete: user.isProfileComplete,
  };
}

async function updateBasic(userId, body, isPatch = false) {
  const update = toBasic(body);
  if (isPatch) {
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true }
  ).exec();
  if (!user) throw new NotFoundError('User not found');
  const profile = await getProfile(userId);
  return { profile };
}

async function updateHealth(userId, body, isPatch = false) {
  const update = toHealth(body);
  if (isPatch && update.healthConsiderations === undefined) {
    const profile = await getProfile(userId);
    return { profile };
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true }
  ).exec();
  if (!user) throw new NotFoundError('User not found');
  const profile = await getProfile(userId);
  return { profile };
}

async function updateNutrition(userId, body, isPatch = false) {
  const update = toNutrition(body);
  if (isPatch) {
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true }
  ).exec();
  if (!user) throw new NotFoundError('User not found');
  const profile = await getProfile(userId);
  return { profile };
}

async function updateActivity(userId, body, isPatch = false) {
  const update = toActivity(body);
  if (isPatch) {
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true }
  ).exec();
  if (!user) throw new NotFoundError('User not found');
  const profile = await getProfile(userId);
  return { profile };
}

async function updateGoals(userId, body, isPatch = false) {
  const update = toGoals(body);
  if (isPatch) {
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  }
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true }
  ).exec();
  if (!user) throw new NotFoundError('User not found');
  const profile = await getProfile(userId);
  return { profile };
}

async function finishProfile(userId, body) {
  const { confirm, consents } = body;
  if (!confirm || !consents?.terms_accepted || !consents?.privacy_accepted || !consents?.health_disclaimer_accepted) {
    throw new ValidationError('All consents must be accepted');
  }
  const user = await User.findById(userId).exec();
  if (!user) throw new NotFoundError('User not found');

  const hasBasic = user.name && user.dateOfBirth != null && user.gender && user.heightCm != null && user.weightKg != null;
  const hasHealth = Array.isArray(user.healthConsiderations) && user.healthConsiderations.length > 0;
  const hasNutrition =
    Array.isArray(user.foodAllergies) &&
    user.foodAllergies.length > 0 &&
    user.dietaryGoal &&
    (user.foodAllergies.includes('other') ? (user.otherAllergyText || '').trim() : true);
  const hasActivity =
    user.activityLevel &&
    Array.isArray(user.preferredWorkouts) &&
    user.preferredWorkouts.length > 0 &&
    user.workoutsPerWeek != null &&
    user.timezone;
  const hasGoals = user.primaryGoal && user.currentBuild;

  const isComplete = hasBasic && hasHealth && hasNutrition && hasActivity && hasGoals;

  user.consents = {
    termsAccepted: true,
    privacyAccepted: true,
    healthDisclaimerAccepted: true,
    acceptedAt: new Date(),
  };
  user.isProfileComplete = isComplete;
  await user.save();

  const profile = await getProfile(userId);
  return { profile, is_profile_complete: isComplete };
}

module.exports = {
  getProfile,
  updateBasic,
  updateHealth,
  updateNutrition,
  updateActivity,
  updateGoals,
  finishProfile,
};
