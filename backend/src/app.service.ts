import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'ESSA É A API DO INIDICA E CONTA! V1.0.0';
  }

}
