import { requireMemberAuth, AuthError, type MemberIdentity } from './member-auth';

const REVIEWER_ROLES = new Set(['refund_reviewer', 'hotel_manager', 'finance_admin']);

export type EmployeeIdentity = MemberIdentity & { roles: string[]; hotelIds: string[] };

function stringList(value: unknown): string[] {
  if (typeof value === 'string') return value.split(/[\s,]+/).filter(Boolean);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export async function requireRefundReviewer(authorization?: string | null): Promise<EmployeeIdentity> {
  const identity = await requireMemberAuth(authorization);
  const roles = stringList(identity.claims.roles ?? identity.claims.role);
  if (!roles.some((role) => REVIEWER_ROLES.has(role))) throw new AuthError('AUTH_FORBIDDEN', '当前员工没有退款审批权限。');
  const hotelIds = stringList(identity.claims.hotelIds ?? identity.claims.hotel_ids ?? identity.claims.hotelId);
  return { ...identity, roles, hotelIds };
}

export function assertEmployeeHotelAccess(employee: EmployeeIdentity, hotelId: string) {
  if (employee.hotelIds.includes(hotelId)) return;
  throw new AuthError('AUTH_FORBIDDEN', '当前员工无权审核该酒店的退款申请。');
}
