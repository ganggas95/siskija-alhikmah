import { Building2 } from "lucide-react"; import { PermissionKey } from "@prisma/client"; import { PageHeader } from "@/components/app/page-header"; import { db } from "@/lib/db"; import { createOrganizationLogoSignedUrl } from "@/lib/supabase-storage"; import { requirePermission } from "@/lib/rbac"; import { ProfileForm } from "./_components/profile-form";
export default async function OrganizationProfilePage() {
  await requirePermission(PermissionKey.MANAGE_SETTINGS);
  const profile = await db.mosqueProfile.findFirst({ orderBy: { createdAt: "asc" } });
  const logoUrl = profile ? await createOrganizationLogoSignedUrl(profile.logoUrl) : null;
  const profileDto = profile
    ? {
        name: profile.name,
        organizationName: profile.organizationName,
        address: profile.address,
        rt: profile.rt,
        rw: profile.rw,
        region: profile.region,
        contactNumber: profile.contactNumber,
        chairmanName: profile.chairmanName,
        treasurerName: profile.treasurerName,
        defaultContributionFee: profile.defaultContributionFee.toString(),
        specialContributionFee: profile.specialContributionFee.toString(),
        fiscalYear: profile.fiscalYear,
        receiptText: profile.receiptText,
        requireExpenseApproval: profile.requireExpenseApproval,
      }
    : { name: "", fiscalYear: new Date().getFullYear(), defaultContributionFee: "0", specialContributionFee: "0", requireExpenseApproval: true };

  return <section className="space-y-6"><PageHeader title="Profil Masjid & Organisasi" description="Atur identitas organisasi dan nominal default iuran." icon={Building2} /><ProfileForm profile={profileDto} logoUrl={logoUrl} /></section>;
}
