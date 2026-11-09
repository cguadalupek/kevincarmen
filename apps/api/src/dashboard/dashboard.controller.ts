import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * `GET /dashboard/admin/summary` — totales por sección y estadísticas del sitio
   * para el dashboard del panel. Solo panel: el agregado no es información pública.
   */
  @Get('admin/summary')
  @UseGuards(JwtAuthGuard)
  summary() {
    return this.dashboardService.summary();
  }
}
