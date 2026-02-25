const express = require('express');
const profileController = require('../controllers/profile.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
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
} = require('../validators/profile.validators');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', profileController.getMe);

router.put('/basic', validate(profileBasicSchema), profileController.putBasic);
router.patch('/basic', validate(profileBasicPatchSchema), profileController.patchBasic);

router.put('/health', validate(profileHealthSchema), profileController.putHealth);
router.patch('/health', validate(profileHealthPatchSchema), profileController.patchHealth);

router.put('/nutrition', validate(profileNutritionSchema), profileController.putNutrition);
router.patch('/nutrition', validate(profileNutritionPatchSchema), profileController.patchNutrition);

router.put('/activity', validate(profileActivitySchema), profileController.putActivity);
router.patch('/activity', validate(profileActivityPatchSchema), profileController.patchActivity);

router.put('/goals', validate(profileGoalsSchema), profileController.putGoals);
router.patch('/goals', validate(profileGoalsPatchSchema), profileController.patchGoals);

router.post('/finish', validate(profileFinishSchema), profileController.finish);

module.exports = router;
