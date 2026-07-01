const { ok, fail } = require("../../utils/apiResponse");
const { simulatePracticeTeamMembers } = require("./demoRegistration.service");

async function simulateStudentRegistration(req, res) {
  try {
    const result = await simulatePracticeTeamMembers(req.user);

    return ok(res, result, "Successfully simulated student registration");
  } catch (error) {
    return fail(
      res,
      error.statusCode || 500,
      error.message || "Cannot simulate student registration",
    );
  }
}

module.exports = {
  simulateStudentRegistration,
};
