import { Controller, Get, Param } from '@nestjs/common';
import { AnafService } from './anaf.service';

/** Public — folosit la înregistrare, înainte de autentificare. */
@Controller('anaf')
export class AnafController {
  constructor(private readonly anaf: AnafService) {}

  @Get(':cui')
  lookup(@Param('cui') cui: string) {
    return this.anaf.lookup(cui);
  }
}
