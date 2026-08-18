import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export type MemberIdentity = { sub: string; claims: JWTPayload };

export class AuthError extends Error {
  constructor(public readonly code: 'AUTH_REQUIRED' | 'AUTH_INVALID' | 'AUTH_FORBIDDEN', message: string) {
    super(message);
  }
}

function authConfig() {
  const issuer = process.env.AUTH_ISSUER;
  const audience = process.env.AUTH_AUDIENCE;
  const jwksUri = process.env.AUTH_JWKS_URI;
  if (!issuer || !audience || !jwksUri) throw new AuthError('AUTH_INVALID', '身份认证服务配置不完整。');
  return { issuer, audience, jwksUri };
}

function bearerToken(authorization?: string | null) {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new AuthError('AUTH_REQUIRED', '退款申请需要先登录会员账户。');
  return match[1];
}

export async function requireMemberAuth(authorization?: string | null): Promise<MemberIdentity> {
  const token = bearerToken(authorization);
  const { issuer, audience, jwksUri } = authConfig();
  try {
    const { payload } = await jwtVerify(token, createRemoteJWKSet(new URL(jwksUri)), {
      issuer,
      audience,
      requiredClaims: ['sub', 'exp']
    });
    if (typeof payload.sub !== 'string' || !payload.sub.trim()) throw new AuthError('AUTH_INVALID', '会员身份缺少有效 subject。');
    return { sub: payload.sub, claims: payload };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('AUTH_INVALID', '会员登录凭证无效或已过期。');
  }
}
