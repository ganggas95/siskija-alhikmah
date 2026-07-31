import { HouseholdStatus, Prisma } from "@prisma/client";

export type HouseholdFilterInput = {
  query?: string;
  regionId?: string;
  status?: string;
  disability?: string;
  elderly?: string;
};

export function buildHouseholdWhere({
  query,
  regionId,
  status,
  disability,
  elderly,
}: HouseholdFilterInput): Prisma.HouseholdWhereInput {
  return {
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { headName: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
            { rt: { contains: query, mode: "insensitive" } },
            { rw: { contains: query, mode: "insensitive" } },
            { region: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(regionId && regionId !== "all" ? { regionId } : {}),
    ...(status === "active"
      ? { status: HouseholdStatus.ACTIVE }
      : status === "inactive"
        ? { status: HouseholdStatus.INACTIVE }
        : {}),
    ...(disability === "yes"
      ? { isDisabled: true }
      : disability === "no"
        ? { isDisabled: false }
        : {}),
    ...(elderly === "yes"
      ? { isElderly: true }
      : elderly === "no"
        ? { isElderly: false }
        : {}),
  };
}
