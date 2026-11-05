import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

/**
 * Formulario público de contacto. Sin `JwtAuthGuard`: lo usa cualquier visitante.
 * El throttler (registrado en `AppModule`) impide que un script inunde el chat
 * de Telegram: 5 mensajes por minuto e IP.
 */
@Controller('contact')
@UseGuards(ThrottlerGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /** `POST /contact` → `{ success: true }` cuando Telegram ha aceptado el mensaje. */
  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  send(@Body() dto: CreateContactMessageDto) {
    return this.contactService.send(dto);
  }
}
