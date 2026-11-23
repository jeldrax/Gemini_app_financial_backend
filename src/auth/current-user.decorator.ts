// src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// del usuario ya validado 
export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

// @CurrentUser() para leer directo en los controllers lo datos antreriores
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest(); // Toma la petición HTTP actual
    return request.user as AuthenticatedUser; // Devuelve el usuario que inyectó el Guard
  },
);
