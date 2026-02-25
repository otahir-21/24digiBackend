const { z } = require('zod');

const HEALTH_CONSIDERATIONS = [
  'heart_conditions',
  'blood_pressure',
  'breathing_lungs',
  'sleep_recovery',
  'blood_sugar_metabolism',
  'none_prefer_not_to_say',
];
const FOOD_ALLERGIES = [
  'none',
  'dairy',
  'eggs',
  'gluten',
  'shellfish',
  'soy',
  'sesame',
  'fish',
  'other',
];
const DIETARY_GOALS = ['balanced', 'high_protein', 'vegan', 'light_fresh'];
const ACTIVITY_LEVELS = [
  'mostly_inactive',
  'lightly_active',
  'moderately_active',
  'very_active',
];
const PREFERRED_WORKOUTS = [
  'walking_light',
  'strength_training',
  'cardio',
  'sports',
  'yoga_stretching',
  'at_home',
  'gym',
  'no_preference',
];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const PRIMARY_GOALS = [
  'improve_fitness',
  'muscle_gain',
  'lose_weight',
  'increase_endurance',
  'stay_healthy',
];
const CURRENT_BUILDS = ['lean', 'average', 'muscular', 'athletic', 'higher_body_fat'];
const GENDERS = ['female', 'male', 'other'];

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

function ageFromDob(dob) {
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

const profileBasicSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  date_of_birth: z
    .string()
    .regex(dateOnlyRegex, 'Invalid date format YYYY-MM-DD')
    .refine((s) => {
      const d = new Date(s);
      return !Number.isNaN(d.getTime());
    }, 'Invalid date')
    .refine((s) => ageFromDob(s) >= 13, 'Age must be at least 13'),
  height_cm: z.number().min(50).max(250),
  weight_kg: z.number().min(20).max(400),
  gender: z.enum(GENDERS),
});

const profileBasicPatchSchema = profileBasicSchema.partial();

const profileHealthSchema = z
  .object({
    health_considerations: z
      .array(z.enum(HEALTH_CONSIDERATIONS))
      .min(1, 'At least one value or none_prefer_not_to_say'),
  })
  .refine(
    (data) => {
      const arr = data.health_considerations || [];
      if (arr.includes('none_prefer_not_to_say')) return arr.length === 1;
      return true;
    },
    { message: 'If none_prefer_not_to_say is selected, it must be the only item', path: ['health_considerations'] }
  );

const profileHealthPatchSchema = z
  .object({
    health_considerations: z.array(z.enum(HEALTH_CONSIDERATIONS)).optional(),
  })
  .refine(
    (data) => {
      const arr = data.health_considerations;
      if (!arr || arr.length === 0) return true;
      if (arr.includes('none_prefer_not_to_say')) return arr.length === 1;
      return true;
    },
    { message: 'If none_prefer_not_to_say is selected, it must be the only item', path: ['health_considerations'] }
  );

const profileNutritionSchema = z
  .object({
    food_allergies: z.array(z.enum(FOOD_ALLERGIES)).min(1),
    other_allergy_text: z.string().trim().optional(),
    dietary_goal: z.enum(DIETARY_GOALS),
  })
  .refine(
    (data) => {
      const arr = data.food_allergies || [];
      if (arr.includes('none')) return arr.length === 1;
      return true;
    },
    { message: 'If none is selected, it must be the only item', path: ['food_allergies'] }
  )
  .refine(
    (data) => {
      const arr = data.food_allergies || [];
      if (arr.includes('other')) return (data.other_allergy_text || '').trim().length > 0;
      return true;
    },
    { message: 'other_allergy_text required when other is selected', path: ['other_allergy_text'] }
  );

const profileNutritionPatchSchema = z
  .object({
    food_allergies: z.array(z.enum(FOOD_ALLERGIES)).optional(),
    other_allergy_text: z.string().trim().optional(),
    dietary_goal: z.enum(DIETARY_GOALS).optional(),
  })
  .refine(
    (data) => {
      const arr = data.food_allergies;
      if (!arr || arr.length === 0) return true;
      if (arr.includes('none')) return arr.length === 1;
      return true;
    },
    { message: 'If none is selected, it must be the only item', path: ['food_allergies'] }
  )
  .refine(
    (data) => {
      const arr = data.food_allergies || [];
      if (arr.includes('other')) return (data.other_allergy_text ?? '').trim().length > 0;
      return true;
    },
    { message: 'other_allergy_text required when other is selected', path: ['other_allergy_text'] }
  );

const profileActivitySchema = z
  .object({
    activity_level: z.enum(ACTIVITY_LEVELS),
    preferred_workouts: z.array(z.enum(PREFERRED_WORKOUTS)).min(1),
    workouts_per_week: z.number().int().min(0).max(7),
    days_off: z.array(z.enum(DAYS)),
    timezone: z.string().trim(),
  })
  .refine(
    (data) => {
      const arr = data.preferred_workouts || [];
      if (arr.includes('no_preference')) return arr.length === 1;
      return true;
    },
    { message: 'If no_preference is selected, it must be the only item', path: ['preferred_workouts'] }
  );

const profileActivityPatchSchema = z
  .object({
    activity_level: z.enum(ACTIVITY_LEVELS).optional(),
    preferred_workouts: z.array(z.enum(PREFERRED_WORKOUTS)).optional(),
    workouts_per_week: z.number().int().min(0).max(7).optional(),
    days_off: z.array(z.enum(DAYS)).optional(),
    timezone: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      const arr = data.preferred_workouts;
      if (!arr || arr.length === 0) return true;
      if (arr.includes('no_preference')) return arr.length === 1;
      return true;
    },
    { message: 'If no_preference is selected, it must be the only item', path: ['preferred_workouts'] }
  );

const profileGoalsSchema = z.object({
  primary_goal: z.enum(PRIMARY_GOALS),
  current_build: z.enum(CURRENT_BUILDS),
});

const profileGoalsPatchSchema = profileGoalsSchema.partial();

const profileFinishSchema = z.object({
  confirm: z.literal(true),
  consents: z.object({
    terms_accepted: z.literal(true),
    privacy_accepted: z.literal(true),
    health_disclaimer_accepted: z.literal(true),
  }),
});

module.exports = {
  profileBasicSchema,
  profileBasicPatchSchema,
  profileHealthSchema,
  profileHealthPatchSchema,
  profileNutritionSchema,
  profileNutritionPatchSchema,
  profileActivitySchema,
  profileActivityPatchSchema,
  profileGoalsSchema,
  profileGoalsPatchSchema,
  profileFinishSchema,
};
