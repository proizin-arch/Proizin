const setupService = require('../services/setupService');

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => error ? reject(error) : resolve());
  });
}

async function complete(req, res) {
  const user = await setupService.complete(req.body);
  await regenerateSession(req);
  req.session.userId = user.id;
  res.status(201).json({ success: true, data: user });
}

module.exports = { complete };
