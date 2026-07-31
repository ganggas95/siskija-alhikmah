import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type AuditPayload = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  beforeData?: Prisma.InputJsonValue;
  afterData?: Prisma.InputJsonValue;
};

export async function createAuditLog(
  payload: AuditPayload,
  tx: typeof db | Prisma.TransactionClient = db,
) {
  return tx.auditLog.create({
    data: {
      userId: payload.userId ?? undefined,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      beforeData: payload.beforeData,
      afterData: payload.afterData,
    },
  });
}
