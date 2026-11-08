import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './env.validation';

const envFiles: Record<string, string> = {
  dev: '.env.dev',
  localprod: '.env.docker',
  prod: '.env',
};

const env = process.env.NODE_ENV || 'dev';
const envFile = envFiles[env] || '.env';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFile,
      validationSchema: envSchema,
      validationOptions: {
        // abortEarly: false, El literal de objeto solo puede especificar propiedades conocidas y 'abortEarly' no existe en el tipo 'Options'.
      },
      expandVariables: true,
    }),
  ],
})
export class ConfigModule {}
