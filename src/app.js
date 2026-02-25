const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const env = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimit.middleware');
const { errorMiddleware } = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  })
);
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(generalLimiter);

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null });
});

app.use(errorMiddleware);

module.exports = app;
