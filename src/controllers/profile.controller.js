const profileService = require('../services/profile.service');
const { success } = require('../utils/response');
const { asyncHandler } = require('../middleware/error.middleware');

async function getMe(req, res) {
  const data = await profileService.getProfile(req.user.userId);
  return success(res, data, 200);
}

async function putBasic(req, res) {
  const data = await profileService.updateBasic(req.user.userId, req.body, false);
  return success(res, data, 200);
}

async function patchBasic(req, res) {
  const data = await profileService.updateBasic(req.user.userId, req.body, true);
  return success(res, data, 200);
}

async function putHealth(req, res) {
  const data = await profileService.updateHealth(req.user.userId, req.body, false);
  return success(res, data, 200);
}

async function patchHealth(req, res) {
  const data = await profileService.updateHealth(req.user.userId, req.body, true);
  return success(res, data, 200);
}

async function putNutrition(req, res) {
  const data = await profileService.updateNutrition(req.user.userId, req.body, false);
  return success(res, data, 200);
}

async function patchNutrition(req, res) {
  const data = await profileService.updateNutrition(req.user.userId, req.body, true);
  return success(res, data, 200);
}

async function putActivity(req, res) {
  const data = await profileService.updateActivity(req.user.userId, req.body, false);
  return success(res, data, 200);
}

async function patchActivity(req, res) {
  const data = await profileService.updateActivity(req.user.userId, req.body, true);
  return success(res, data, 200);
}

async function putGoals(req, res) {
  const data = await profileService.updateGoals(req.user.userId, req.body, false);
  return success(res, data, 200);
}

async function patchGoals(req, res) {
  const data = await profileService.updateGoals(req.user.userId, req.body, true);
  return success(res, data, 200);
}

async function finish(req, res) {
  const data = await profileService.finishProfile(req.user.userId, req.body);
  return success(res, data, 200);
}

module.exports = {
  getMe: asyncHandler(getMe),
  putBasic: asyncHandler(putBasic),
  patchBasic: asyncHandler(patchBasic),
  putHealth: asyncHandler(putHealth),
  patchHealth: asyncHandler(patchHealth),
  putNutrition: asyncHandler(putNutrition),
  patchNutrition: asyncHandler(patchNutrition),
  putActivity: asyncHandler(putActivity),
  patchActivity: asyncHandler(patchActivity),
  putGoals: asyncHandler(putGoals),
  patchGoals: asyncHandler(patchGoals),
  finish: asyncHandler(finish),
};
