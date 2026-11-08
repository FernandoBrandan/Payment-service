export const LOGGER = Symbol('LOGGER');
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

// ---------------------------------------------------------------------------------

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
export const PAYMENT_PREFERENCE_REPOSITORY = Symbol('PAYMENT_PREFERENCE_REPOSITORY');

export const WEBHOOK_EVENT_REPOSITORY = Symbol('WEBHOOK_EVENT_REPOSITORY');

// ---------------------------------------------------------------------------------

export const EVENT_CONSUMER = Symbol('EVENT_CONSUMER');
export const EVENT_CONSUMER_HEALTH = Symbol('EVENT_CONSUMER_HEALTH');
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
export const EVENT_PUBLISHER_HEALTH = Symbol('EVENT_PUBLISHER_HEALTH');
