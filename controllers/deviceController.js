const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const { UserDevice, sequelize } = require("./../model");
const logger = require("./../utils/logger");
const UAParser = require("ua-parser-js");

function determineDeviceType(type) {
  if (type === 'mobile' || type === 'tablet') return type;
  return 'desktop';
}

exports.getDeviceDistribution = catchAsync(async (req, res, next) => {
  const deviceDistribution = await UserDevice.findAll({
    attributes: [
      'deviceType',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['deviceType'],
    raw: true,
  });

  res.status(200).json(deviceDistribution);
});

exports.checkUserDevice = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log("checkUserDevice function called");
  }

  const parser = new UAParser(req.headers['user-agent']);
  const result = parser.getResult();

  const deviceData = {
    userId: req.user.id,
    deviceType: determineDeviceType(result.device.type),
    deviceName: `${result.device.vendor || ''} ${result.device.model || ''}`.trim() || 'Unknown',
    browserName: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    osName: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
  };

  await UserDevice.create(deviceData)
  next();
});

exports.parseUserDevice = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log("parseUserDevice function called");
    }
  
    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();
  
    req.userDevice = {
      deviceType: determineDeviceType(result.device.type),
      deviceName: `${result.device.vendor || ''} ${result.device.model || ''}`.trim() || 'Unknown',
      browserName: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      osName: result.os.name || 'Unknown',
      osVersion: result.os.version || 'Unknown',
    };
    
    next();
  };