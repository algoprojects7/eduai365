import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/auth.decorators';
import { AppService } from './app.service';

@ApiTags('platform')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'API root — service info' })
  getRoot() {
    return this.appService.getInfo();
  }
}
