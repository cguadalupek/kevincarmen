import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

/** Telegram tarda ~1 s; 10 s es margen de sobra sin dejar al usuario esperando. */
const TELEGRAM_TIMEOUT_MS = 10_000;
const TELEGRAM_API = 'https://api.telegram.org';

/** Respuesta relevante de `sendMessage` (solo los campos que se leen). */
interface TelegramResponse {
  ok: boolean;
  description?: string;
}

/**
 * Entrega los mensajes del formulario público de contacto a un chat de Telegram.
 *
 * No persiste nada: Telegram es el buzón. Por eso, si las credenciales no están
 * configuradas el endpoint responde **503** en vez de aceptar y perder el mensaje.
 */
@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  /**
   * El mensaje se envía con `parse_mode: 'HTML'`, así que el texto del visitante
   * se escapa: si escribiera `<b>` el mensaje se rompería (o inyectaría formato).
   */
  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private buildText(dto: CreateContactMessageDto) {
    const name = this.escapeHtml(dto.name.trim());
    const email = this.escapeHtml(dto.email.trim());
    const message = this.escapeHtml(dto.message.trim());

    return (
      `<b>📩 Nuevo mensaje de contacto</b>\n\n` +
      `<b>Nombre:</b> ${name}\n` +
      `<b>Email:</b> ${email}\n` +
      `<b>Mensaje:</b>\n${message}`
    );
  }

  async send(dto: CreateContactMessageDto) {
    if (!dto.name.trim() || !dto.email.trim() || !dto.message.trim()) {
      throw new BadRequestException('Revisa el formulario: no puede quedar ningún campo vacío.');
    }

    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!token || !chatId) {
      this.logger.error(
        'Faltan TELEGRAM_BOT_TOKEN y/o TELEGRAM_CHAT_ID: el formulario de contacto no puede entregar mensajes.',
      );
      throw new ServiceUnavailableException(
        'El formulario de contacto no está disponible ahora mismo. Escríbeme por email.',
      );
    }

    const body = JSON.stringify({
      chat_id: chatId,
      text: this.buildText(dto),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });

    let response: Response;

    try {
      response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error(`No se pudo contactar con la API de Telegram: ${String(error)}`);
      throw new BadGatewayException(
        'No se pudo entregar el mensaje. Inténtalo de nuevo en unos minutos.',
      );
    }

    const result = (await response.json().catch(() => null)) as TelegramResponse | null;

    if (!response.ok || !result?.ok) {
      // Nunca se registra la URL: contiene el token del bot.
      this.logger.error(
        `Telegram rechazó el mensaje (HTTP ${response.status}): ${result?.description ?? 'sin detalle'}`,
      );
      throw new BadGatewayException(
        'No se pudo entregar el mensaje. Inténtalo de nuevo en unos minutos.',
      );
    }

    return { success: true };
  }
}
