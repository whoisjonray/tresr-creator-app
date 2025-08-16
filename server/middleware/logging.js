// Logging middleware
const logActivity = (message) => {
  return (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${message} - User: ${req.session?.creator?.id || 'anonymous'}`);
    next();
  };
};

module.exports = {
  logActivity
};