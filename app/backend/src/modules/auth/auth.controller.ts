import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { AuthService } from './auth.service';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';
import {
  ActivateDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly clients: ClientsService,
  ) {}

  /**
   * Înregistrare directă (cont inactiv + email activare).
   * Notă: în producție contul se creează după confirmarea plății (Stripe webhook),
   * care apelează același AuthService.registerClient.
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const client = await this.auth.registerClient(dto);
    return { id: client.id, status: client.status };
  }

  @Post('activate')
  activate(@Body() dto: ActivateDto) {
    return this.auth.activate(dto.token, dto.password);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.auth.requestPasswordReset(dto.email);
    return { ok: true };
  }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const client = await this.clients.getOrFail(user.id);
    return {
      id: client.id,
      email: client.email,
      role: client.role,
      status: client.status,
      companyName: client.companyName,
      cui: client.cui,
      workpointsAllowed: client.workpointsAllowed,
      contractExpiresAt: client.contractExpiresAt,
    };
  }
}
