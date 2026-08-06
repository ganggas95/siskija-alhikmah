import { BillStatus, ContributionPaymentStatus, type Prisma } from "@prisma/client";
import Decimal from "decimal.js";

type TransactionClient = Prisma.TransactionClient;

export function deriveContributionBillStatus(amountDue: Decimal, totalPaid: Decimal) {
  if (totalPaid.lte(0)) {
    return BillStatus.BELUM_BAYAR;
  }

  if (totalPaid.greaterThanOrEqualTo(amountDue)) {
    return BillStatus.LUNAS;
  }

  return BillStatus.SEBAGIAN;
}

export async function calculateContributionBillTotalPaid(
  tx: TransactionClient,
  billId: string,
) {
  const payments = await tx.contributionPayment.findMany({
    where: {
      billId,
      canceledAt: null,
      status: ContributionPaymentStatus.VERIFIED,
    },
    select: {
      amountPaid: true,
    },
  });

  return payments.reduce(
    (total, payment) => total.plus(payment.amountPaid.toString()),
    new Decimal(0),
  );
}

export async function refreshContributionBillStatus(
  tx: TransactionClient,
  billId: string,
) {
  const bill = await tx.contributionBill.findUnique({
    where: { id: billId },
    select: {
      id: true,
      amountDue: true,
      status: true,
      canceledAt: true,
    },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan.");
  }

  if (bill.canceledAt || bill.status === BillStatus.DIBATALKAN) {
    return bill.status;
  }

  if (bill.status === BillStatus.DIBEBASKAN) {
    return BillStatus.DIBEBASKAN;
  }

  const totalPaid = await calculateContributionBillTotalPaid(tx, billId);
  const nextStatus = deriveContributionBillStatus(
    new Decimal(bill.amountDue.toString()),
    totalPaid,
  );

  if (nextStatus !== bill.status) {
    await tx.contributionBill.update({
      where: { id: billId },
      data: { status: nextStatus },
    });
  }

  return nextStatus;
}
