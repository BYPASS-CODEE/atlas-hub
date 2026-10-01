import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: (() => {
    const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be configured in production.');
    }
    return secret || 'atlas_hub_dev_only_secret_change_me';
  })(),
  jwtExpiresIn: '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
