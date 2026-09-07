const dashboardRepository = require('../repositories/dashboardRepository');

async function getSummary(user) {
  return dashboardRepository.summary(user);
}

module.exports = { getSummary };
