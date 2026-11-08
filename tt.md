## DEV (host `pnpm start:dev` + servicios en Docker)

```
1. (una sola vez) Aplicar pre-flight 1, 4, 5(parcial), 8, 11
2. cp .env.dev .env.dev   # editar en sitio:
   - PAYMENT_PROVIDER=mercadopago       # o 'fake' si querés probar sin MP
   - MERCADOPAGO_ACCESS_TOKEN=<real>    # TEST credentials de MP (sandbox)
   - MERCADOPAGO_WEBHOOK_SECRET=<real>  # dashboard MP → webhooks
   - MP_API=https://api.mercadopago.com
   - WEBHOOK_URL=https://<ngrok-id>.ngrok-free.app/webhooks/mercadopago
   - SUCCESS_URL / FAILURE_URL / PENDING_URL=https://<front>/checkout/...
3. pnpm install
4. ./run.sh dev              # postgres:5433 + redis:6379 + rabbitmq:5672/15672
5. pnpm migration:run        # usa .env.dev (port 5433)
6. pnpm start:dev            # http://localhost:3002  (NO 3000)
7. Verificar:
   GET http://localhost:3002/health/live
   GET http://localhost:3002/health/ready
8. Probar webhook local:
   ngrok http 3002
   → pegar URL pública en MERCADOPAGO_WEBHOOK_URL en .env.dev y en dashboard MP
   → crear preferencia → pagar en sandbox → MP llama /webhooks/mercadopago
```

## LOCALPROD (todo dockerizado, pre-prod)

```
1. (una sola vez) Aplicar pre-flight 2, 3, 5(completo), 6, 10
2. Editar .env.docker:
   - NODE_ENV=localprod
   - DB_HOST=postgres / REDIS_HOST=redis
   - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
   - PAYMENT_PROVIDER=mercadopago
   - MERCADOPAGO_ACCESS_TOKEN=<real sandbox o prod>
   - MERCADOPAGO_WEBHOOK_SECRET=<real>
   - MP_API=https://api.mercadopago.com
   - WEBHOOK_URL=<URL pública (ngrok o dominio)>
   - SUCCESS_URL / FAILURE_URL / PENDING_URL=<front público>
3. pnpm install --frozen-lockfile
4. ./run.sh prod             # build → baja dev → levanta app+pg+redis+rabbit
                             # APP_PORT=3002, migraciones corren solas (migrationsRun=true)
5. Verificar:
   GET http://localhost:3002/health/live
   GET http://localhost:3002/health/ready     # checa DB + event bus (pub + cons)
6. Logs:
   ./run.sh logs
   ./run.sh logs app
7. Shell / DB:
   ./run.sh sh app
   ./run.sh db              # psql al container payment_postgres
8. Flujo e2e manual:
   - desde ecommerce (o curl) publicar ecommerce.order.created al exchange
     (o levantar ecommerce y crear orden)
   - payment consume → crea preferencia → publica payment.link.created
   - pagar en sandbox MP → MP llama webhook → payment.approved
9. Down:
   ./run.sh down
   ./run.sh nuke            # ⚠️ borra volúmenes
```

## PROD (hosting)

```
1. Variables de entorno en el hosting (NUNCA en repo):
   NODE_ENV=prod
   PORT=3002
   DB_HOST / DB_PORT / DB_USER / DB_PASS / DB_NAME
   DB_LOGGING=false
   REDIS_HOST / REDIS_PORT
   EVENT_BUS_DRIVER=rabbitmq
   RABBITMQ_URL=amqp://<user>:<pass>@<host>:5672
   RABBITMQ_EXCHANGE=ecommerce
   PAYMENT_PROVIDER=mercadopago
   MERCADOPAGO_ACCESS_TOKEN=<real PRODUCTION>
   MERCADOPAGO_WEBHOOK_SECRET=<real PRODUCTION>
   MP_API=https://api.mercadopago.com
   WEBHOOK_URL=https://<dominio-prod>/webhooks/mercadopago
   SUCCESS_URL / FAILURE_URL / PENDING_URL=https://<front-prod>/...
   PAYMENT_TIMEOUT_MS=5000
   PAYMENT_RETRY_ATTEMPTS=3 / PAYMENT_RETRY_BASE_MS=500 / PAYMENT_RETRY_MAX_MS=4000
   PAYMENT_CB_THRESHOLD=5 / PAYMENT_CB_RESET_MS=30000
   PAYMENT_BH_MAX_CONCURRENT=10 / PAYMENT_BH_MAX_QUEUE=20 / PAYMENT_BH_QUEUE_TIMEOUT_MS=5000
   LOG_LEVEL=info
   SERVICE_NAME=payment-api
   OBSERVE_APP_KEY / OBSERVE_APP_SECRET   (si pre-flight 11 queda activo)
   JWT_SECRET=<openssl rand -hex 32>       (si pre-flight 4(bis) no lo quita — no se usa en payment)

2. pnpm install --frozen-lockfile
3. pnpm build
4. Migraciones: automáticas (migrationsRun=true en NODE_ENV=prod).
   NO correr `pnpm migration:run` a mano — el script usa data-source.ts que
   espera .env.dev / .env.docker. Solo si necesitás generarlas en una DB limpia.

5. pnpm start:prod              # node dist/main  (NODE_ENV=prod)
6. Verificar:
   GET https://<host>/health/live
   GET https://<host>/health/ready    # DB + event bus pub/cons
7. Registrar webhook en el dashboard de MercadoPago:
   URL: https://<host>/webhooks/mercadopago
   Eventos: payment
   → copiar el secret resultante y verificar que coincide con
     MERCADOPAGO_WEBHOOK_SECRET (si no, todos los webhooks devuelven error)
8. Flujo real:
   - ecommerce (prod) publica ecommerce.order.created
   - payment consume → MP preference real → payment.link.created
   - usuario paga → MP llama webhook HTTPS público → payment.approved
   - ecommerce consume payment.approved → orden PAID
9. Smoke opcional (manual, no hay script):
   - crear orden real en ecommerce prod con MP sandbox NO sirve en prod
   - alternativa: crear preferencia directa via curl POST /payments con
     body {provider, externalReference, amount, currency}, pagar en sandbox,
     verificar que payment.approved llega al exchange ecommerce
```

