import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  live() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready() {
    const checks: Record<string, any> = {};
    const results = await Promise.allSettled([
      this.healthService.checkDatabase(),
      this.healthService.checkEventBusPublisher(),
      this.healthService.checkEventBusConsumer(),
    ]);

    checks.database =
      results[0].status === 'fulfilled'
        ? results[0].value
        : { status: 'down', error: (results[0].reason as Error).message };

    checks.eventBusPublisher =
      results[1].status === 'fulfilled'
        ? results[1].value
        : { status: 'down', error: (results[1].reason as Error).message };

    checks.eventBusConsumer =
      results[2].status === 'fulfilled'
        ? results[2].value
        : { status: 'down', error: (results[2].reason as Error).message };

    const dbUp = checks.database.status === 'up';

    // Si DB  están down, el servicio no está listo para recibir tráfico
    if (!dbUp) {
      throw new ServiceUnavailableException({
        status: 'error',
        checks,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}
