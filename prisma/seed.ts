import bcrypt from "bcryptjs";
import {
  PrismaClient,
  AppRoleKey,
  PermissionKey,
  CategoryType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const permissions = Object.values(PermissionKey).map((key) => ({
    key,
    name: key.replaceAll("_", " "),
  }));

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });

  const roleMap: Record<AppRoleKey, PermissionKey[]> = {
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

  for (const key of Object.values(AppRoleKey)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: key },
      create: { key, name: key },
    });

    for (const permissionKey of roleMap[key]) {
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

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = [
    { name: "Admin Masjid", email: "admin@sismata.local", role: AppRoleKey.ADMIN },
    { name: "Bendahara Masjid", email: "bendahara@sismata.local", role: AppRoleKey.TREASURER },
    { name: "Auditor Takmir", email: "auditor@sismata.local", role: AppRoleKey.AUDITOR },
  ];

  for (const userSeed of users) {
    const user = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        name: userSeed.name,
        passwordHash,
        isActive: true,
      },
      create: {
        name: userSeed.name,
        email: userSeed.email,
        passwordHash,
      },
    });

    const role = await prisma.role.findUniqueOrThrow({
      where: { key: userSeed.role },
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

  await prisma.mosqueProfile.upsert({
    where: { id: "default-mosque-profile" },
    update: {
      organizationName: "Yayasan Al Barokah",
      defaultContributionFee: "7000",
      specialContributionFee: "5000",
    },
    create: {
      id: "default-mosque-profile",
      name: "Masjid Al Barokah",
      organizationName: "Yayasan Al Barokah",
      address: "Jl. Kebajikan No. 10",
      region: "Dusun Tengah",
      chairmanName: "Ahmad Fadhil",
      treasurerName: "Siti Aminah",
      defaultContributionFee: "7000",
      specialContributionFee: "5000",
      fiscalYear: 2026,
    },
  });

  await prisma.contributionSetting.upsert({
    where: { id: "default-contribution-setting" },
    update: {
      defaultAmount: "7000",
      isActive: true,
    },
    create: {
      id: "default-contribution-setting",
      defaultAmount: "7000",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    },
  });

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
      update: {},
      create: category,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
