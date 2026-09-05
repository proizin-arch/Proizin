const dashboardService = require('../services/dashboardService');

function summary(req, res) {
  res.json({ success: true, data: dashboardService.getSummary(req.user) });
}

module.exports = { summary };
