// Error handling middleware

const errorMiddleware = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`Error [${status}]:`, message);

  res.status(status).json({
    success: false,
    status,
    message,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
};

module.exports = errorMiddleware;
