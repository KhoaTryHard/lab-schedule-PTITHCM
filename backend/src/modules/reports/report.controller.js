const { ok } = require('../../utils/apiResponse');
const reportService = require('./report.service');

async function getBasicReport(req, res) {
  const report = await reportService.getBasicReport();
  return ok(res, report, 'Successfully fetched basic report');
}

module.exports = {
  getBasicReport
};
