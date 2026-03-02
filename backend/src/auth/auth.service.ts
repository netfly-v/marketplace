import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { Response } from 'express';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.create(dto);
    return user;
  }

  async login(dto: LoginDto, res: Response): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new ForbiddenException('Account is blocked');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    this.setTokenCookies(res, accessToken, refreshToken);

    return this.sanitizeUser(user);
  }

  async refresh(
    refreshToken: string | undefined,
    res: Response,
  ): Promise<Omit<User, 'password'>> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);

      if (!user || user.isBlocked) {
        throw new UnauthorizedException('User not found or blocked');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.generateAccessToken(newPayload);
      const newRefreshToken = this.generateRefreshToken(newPayload);

      this.setTokenCookies(res, newAccessToken, newRefreshToken);

      return this.sanitizeUser(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  logout(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  private generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(
      { ...payload },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<StringValue>(
          'JWT_ACCESS_EXPIRATION',
        ),
      },
    );
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(
      { ...payload },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<StringValue>(
          'JWT_REFRESH_EXPIRATION',
        ),
      },
    );
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}
