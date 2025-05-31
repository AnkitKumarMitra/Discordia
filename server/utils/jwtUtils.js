import jwt from 'jsonwebtoken';

export const verifySocketToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
};
