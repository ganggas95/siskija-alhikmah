import bcrypt from "bcryptjs";
import {
  AppRoleKey,
  CategoryType,
  PermissionKey,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

const rolePermissions: Record<AppRoleKey, PermissionKey[]> = {
  ADMIN: Object.values(PermissionKey),
  TREASURER: [
    PermissionKey.MANAGE_REGIONS,
    PermissionKey.MANAGE_HOUSEHOLDS,
    PermissionKey.MANAGE_CONTRIBUTIONS,
    PermissionKey.MANAGE_INCOME,
    PermissionKey.MANAGE_EXPENSES,
    PermissionKey.VERIFY_TRANSACTIONS,
    PermissionKey.VIEW_REPORTS,
  ],
  AUDITOR: [PermissionKey.VIEW_REPORTS, PermissionKey.VIEW_AUDIT_LOG],
};

const demoUsers = [
  { name: "Admin Masjid", email: "admin@sismata.local", role: AppRoleKey.ADMIN },
  {
    name: "Bendahara Masjid",
    email: "bendahara@sismata.local",
    role: AppRoleKey.TREASURER,
  },
  {
    name: "Auditor Takmir",
    email: "auditor@sismata.local",
    role: AppRoleKey.AUDITOR,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  for (const permissionKey of Object.values(PermissionKey)) {
    await prisma.permission.upsert({
      where: { key: permissionKey },
      update: { name: permissionKey.replaceAll("_", " ") },
      create: {
        key: permissionKey,
        name: permissionKey.replaceAll("_", " "),
      },
    });
  }

  for (const roleKey of Object.values(AppRoleKey)) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: { name: roleKey },
      create: { key: roleKey, name: roleKey },
    });

    for (const permissionKey of rolePermissions[roleKey]) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  for (const demoUser of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        name: demoUser.name,
        passwordHash,
        isActive: true,
      },
      create: {
        name: demoUser.name,
        email: demoUser.email,
        passwordHash,
        isActive: true,
      },
    });

    const role = await prisma.role.findUniqueOrThrow({
      where: { key: demoUser.role },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }

  const categorySeeds = [
    { name: "Iuran Jamaah", type: CategoryType.INCOME },
    { name: "Sedekah", type: CategoryType.INCOME },
    { name: "Kotak Amal", type: CategoryType.INCOME },
    { name: "Donasi", type: CategoryType.INCOME },
    { name: "Listrik", type: CategoryType.EXPENSE },
    { name: "Air", type: CategoryType.EXPENSE },
    { name: "Perawatan", type: CategoryType.EXPENSE },
    { name: "Honor Petugas", type: CategoryType.EXPENSE },
    { name: "Majelis Taklim", type: CategoryType.EXPENSE },
    { name: "Gotong Royong", type: CategoryType.EXPENSE },
    { name: "Konsumsi Majelis Taklim", type: CategoryType.EXPENSE },
  ];

  for (const category of categorySeeds) {
    await prisma.transactionCategory.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: { isActive: true, deletedAt: null },
      create: category,
    });
  }

  console.log("Staging initialized with roles, permissions, demo users, and transaction categories only.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
