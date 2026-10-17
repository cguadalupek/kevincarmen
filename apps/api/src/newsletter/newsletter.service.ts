import { Injectable, NotFoundException } from '@nestjs/common';
import { NewsletterStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';

/** Longitudes máximas: email según RFC 5321, nombre según el DTO. */
const EMAIL_MAX_LENGTH = 254;
const NAME_MAX_LENGTH = 120;

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  /** Los emails no distinguen mayúsculas: se guardan normalizados. */
  private normalizeEmail(email: string) {
    return email.trim().toLowerCase().slice(0, EMAIL_MAX_LENGTH);
  }

  /** Nombre vacío o solo espacios = sin nombre (`null`), no cadena vacía. */
  private normalizeName(name?: string | null) {
    const value = name?.trim();
    return value ? value.slice(0, NAME_MAX_LENGTH) : null;
  }

  /**
   * Alta idempotente: si el email ya existe en estado ACTIVE se devuelve la fila
   * tal cual (ni duplica ni da error); si estaba dado de baja, se reactiva.
   */
  async subscribe(dto: CreateNewsletterDto) {
    const email = this.normalizeEmail(dto.email);
    const name = this.normalizeName(dto.name);

    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });

    if (existing) {
      if (existing.status === NewsletterStatus.ACTIVE) return existing;

      return this.prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: NewsletterStatus.ACTIVE,
          unsubscribedAt: null,
          ...(name ? { name } : {}),
        },
      });
    }

    return this.prisma.newsletterSubscriber.create({ data: { email, name } });
  }

  /**
   * Baja pública por email. Idempotente: repetirla no falla. La fila NO se borra
   * (baja lógica) para conservar el histórico de altas.
   */
  async unsubscribe(email: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    if (!subscriber) {
      throw new NotFoundException('No hay ninguna suscripción con ese email.');
    }

    if (subscriber.status === NewsletterStatus.UNSUBSCRIBED) return subscriber;

    return this.prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: NewsletterStatus.UNSUBSCRIBED, unsubscribedAt: new Date() },
    });
  }

  /** Listado del panel: más recientes primero. */
  findAllAdmin() {
    return this.prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({ where: { id } });

    if (!subscriber) {
      throw new NotFoundException('Suscripción no encontrada.');
    }

    return subscriber;
  }

  async update(id: string, dto: UpdateNewsletterDto) {
    await this.findById(id);

    const data: { name?: string | null; status?: NewsletterStatus; unsubscribedAt?: Date | null } =
      {};

    if (dto.name !== undefined) data.name = this.normalizeName(dto.name);

    if (dto.status !== undefined) {
      data.status = dto.status;
      // La fecha de baja se mantiene coherente con el estado editable a mano.
      data.unsubscribedAt = dto.status === NewsletterStatus.UNSUBSCRIBED ? new Date() : null;
    }

    return this.prisma.newsletterSubscriber.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.newsletterSubscriber.delete({ where: { id } });

    return { success: true };
  }
}
