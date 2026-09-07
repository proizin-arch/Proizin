const dashboardService = require('../services/dashboardService');

async function summary(req, res) {
  res.json({ success: true, data: await dashboardService.getSummary(req.user) });
}

module.exports = { summary };
