const dashboardRepository = require('../repositories/dashboardRepository');

function getSummary(user) {
  return dashboardRepository.summary(user);
}

module.exports = { getSummary };
