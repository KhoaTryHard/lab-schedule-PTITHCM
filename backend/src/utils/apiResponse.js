function ok(res, data, message = 'OK') {
  return res.json({
    success: true,
    message,
    data
  });
}

function created(res, data, message = 'Created') {
  return res.status(201).json({
    success: true,
    message,
    data
  });
}

function fail(res, statusCode, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    details
  });
}

module.exports = {
  ok,
  created,
  fail
};
