import crypto from 'crypto';

const secret = crypto.randomBytes(64).toString('base64');
console.log('JWT_RESET_SECRET=' + secret);