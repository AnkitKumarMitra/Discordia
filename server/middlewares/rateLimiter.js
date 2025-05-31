import limiter from '../config/rateLimit.js';

const rateLimit = (req, res, next) => {
  limiter(req, res, next);
};

export default rateLimit;