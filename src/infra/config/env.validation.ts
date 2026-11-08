import * as Joi from 'joi';

// Schema default + personalizado por proyecto
export const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'localprod', 'prod', 'test').default('dev'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_LOGGING: Joi.boolean().default(false),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),

  PAYMENT_PROVIDER: Joi.string().valid('mercadopago').required(),
  PAYMENT_TIMEOUT_MS: Joi.number().min(100).default(5000),

  PAYMENT_RETRY_ATTEMPTS: Joi.number().min(1).max(10).default(3),
  PAYMENT_RETRY_BASE_MS: Joi.number().min(10).default(500),
  PAYMENT_RETRY_MAX_MS: Joi.number().min(100).default(4000),

  PAYMENT_CB_THRESHOLD: Joi.number().min(1).max(100).default(5),
  PAYMENT_CB_RESET_MS: Joi.number().min(1000).default(30000),

  PAYMENT_BH_MAX_CONCURRENT: Joi.number().min(1).max(1000).default(10),
  PAYMENT_BH_MAX_QUEUE: Joi.number().min(0).max(1000).default(20),
  PAYMENT_BH_QUEUE_TIMEOUT_MS: Joi.number().min(100).default(5000),

  MERCADOPAGO_API: Joi.string().allow('').optional(),
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().allow('').optional(),
  WEBHOOK_URL: Joi.string().allow('').optional(),
  SUCCESS_URL: Joi.string().allow('').optional(),
  FAILURE_URL: Joi.string().allow('').optional(),
  PENDING_URL: Joi.string().allow('').optional(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  SERVICE_NAME: Joi.string().default('ecommerce-api'),

  RECONCILIATION_ENABLED: Joi.boolean().default(true),
  RECONCILIATION_WINDOW_MINUTES: Joi.number().min(1).default(60),
  RECONCILIATION_BATCH_SIZE: Joi.number().min(1).max(500).default(50),

  EVENT_BUS_DRIVER: Joi.string().valid('in-memory', 'rabbitmq').default('in-memory'),
  RABBITMQ_URL: Joi.string()
    .uri({ scheme: ['amqp', 'amqps'] })
    .default('amqp://guest:guest@localhost:5672'),
  RABBITMQ_EXCHANGE: Joi.string().default('ecommerce'),
});
