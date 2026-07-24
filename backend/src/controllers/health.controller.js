const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running"
  });
};

module.exports = {
  getHealthStatus
};
