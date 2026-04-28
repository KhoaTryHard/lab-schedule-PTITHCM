function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
