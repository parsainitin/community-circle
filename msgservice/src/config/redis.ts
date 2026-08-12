import dotenv from 'dotenv';

dotenv.config();

export const getRedisConnectionOptions = () => {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  const isUpstash = host.includes('upstash.io') || process.env.REDIS_TLS === 'true';

  return {
    host,
    port,
    password,
    maxRetriesPerRequest: null,
    ...(isUpstash
      ? {
          tls: {
            servername: host,
          },
        }
      : {}),
  };
};
