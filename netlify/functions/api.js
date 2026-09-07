const serverless = require('serverless-http');
const { createApp } = require('../../backend/app');
const { readyDatabase } = require('../../backend/config/database');

const expressHandler = serverless(createApp());

exports.handler = async (event, context) => {
  await readyDatabase();
  return expressHandler(event, context);
};
