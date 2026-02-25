const env = require('./config/env');
const { connectDb } = require('./config/db');
const app = require('./app');
const logger = require('./utils/logger');

connectDb().then(() => {
  const server = app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = () => {
    logger.info('Shutting down...');
    server.close(() => {
      const { disconnectDb } = require('./config/db');
      disconnectDb()
        .then(() => {
          logger.info('Closed');
          process.exit(0);
        })
        .catch((err) => {
          logger.error('Disconnect error', err);
          process.exit(1);
        });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});
