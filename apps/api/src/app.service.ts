import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'KevinCarmen API',
      version: '0.1.0',
      description: 'REST API for kevincarmen.xyz platform',
    };
  }
}
