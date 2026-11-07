import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { STUDENT_ROLE } from './roles';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildSession(user);
  }

  /**
   * Alta pública de estudiante. El rol `student` se crea si aún no existe, así que
   * el registro funciona en una base recién migrada sin correr el seed.
   *
   * El token que devuelve es el mismo JWT del CMS, pero con `role: 'student'`:
   * `JwtAuthGuard` rechaza ese rol en las rutas del panel (ver el guard), y los
   * endpoints de progreso usan `SessionAuthGuard`, que sí lo acepta.
   */
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const role = await this.prisma.role.upsert({
      where: { name: STUDENT_ROLE },
      update: {},
      create: { name: STUDENT_ROLE, description: 'Estudiante (progreso de cursos)' },
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        name: dto.name.trim(),
        roleId: role.id,
      },
      include: { role: true },
    });

    return this.buildSession(user);
  }

  private buildSession(user: { id: string; email: string; name: string; role: { name: string } }) {
    const payload = { sub: user.id, email: user.email, role: user.role.name };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    };
  }
}
