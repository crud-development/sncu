import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AuthUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { ClientDocument } from './schemas/client.schema';
import { UpdateProfileDto } from './dto/profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  async get(@CurrentUser() user: AuthUser) {
    return this.serialize(await this.clients.getOrFail(user.id));
  }

  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.serialize(await this.clients.updateProfile(user.id, dto));
  }

  /** Verifică dacă profilul are datele administratorului completate (precondiție contract). */
  private serialize(c: ClientDocument) {
    return {
      id: c.id,
      companyName: c.companyName,
      cui: c.cui,
      regCom: c.regCom,
      address: c.address,
      city: c.city,
      judet: c.judet,
      tipActivitate: c.tipActivitate,
      ansvsaAuthorization: c.ansvsaAuthorization,
      email: c.email,
      phone: c.phone,
      contactFirstName: c.contactFirstName,
      contactLastName: c.contactLastName,
      adminName: c.adminName,
      adminIdSeries: c.adminIdSeries,
      adminIdNumber: c.adminIdNumber,
      workpointsAllowed: c.workpointsAllowed,
      contractExpiresAt: c.contractExpiresAt,
      adminComplete: Boolean(c.adminName && c.adminIdSeries && c.adminIdNumber),
    };
  }
}
