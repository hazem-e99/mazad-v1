import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Plate } from "@/models/Plate";
import { Auction } from "@/models/Auction";
import "@/models/PlateLogo";
import { getSession, hasPermission } from "@/lib/auth";
import { getServerTranslator } from "@/lib/i18n-server";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { Card, CardBody } from "@/components/ui/Card";
import { toPlateDTO, type LeanPlate } from "@/lib/dto";
import { UserAuctionForm } from "./UserAuctionForm";

export const revalidate = 0;

interface Props {
  params: Promise<{ plateId: string }>;
}

/**
 * The plate owner's own "create an auction" flow (§ User-Created
 * Auctions) — a trimmed version of /admin/auctions/new: no plate picker
 * (fixed from the URL), no category choice (forced "regular" server-side
 * regardless), submits into "draft" (pending admin review) rather than
 * live/scheduled. Eligibility is re-checked here only to decide what to
 * *show*; POST /api/auctions enforces the same rules server-side
 * regardless of what this page renders.
 */
export default async function NewUserAuctionPage({ params }: Props) {
  const { plateId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session, "auction:create")) redirect("/my-listings");

  await connectDB();
  const { t, locale } = await getServerTranslator();

  const doc = await Plate.findById(plateId).populate("logo").lean<LeanPlate>();
  if (!doc) notFound();
  const plate = toPlateDTO(doc);

  const ownerId = plate.ownerUser;
  if (ownerId !== session.sub) redirect("/my-listings");

  const blockedReason =
    plate.moderationStatus !== "approved"
      ? t("pages.auctionBlockedNotApproved")
      : !plate.isVisible
        ? t("pages.auctionBlockedHidden")
        : (await Auction.exists({ plate: plate._id, status: { $in: ["draft", "scheduled", "live"] } }))
          ? t("pages.auctionBlockedActiveExists")
          : null;

  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="mz-container max-w-2xl py-10">
      <Link
        href="/my-listings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) transition-colors hover:text-(--color-gold)"
      >
        <Back className="h-4 w-4" aria-hidden="true" />
        {t("pages.myListingsTitle")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-(--color-text)">{t("pages.createAuctionAction")}</h1>

      <div className="mb-6 flex items-center justify-center rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-8">
        <SaudiPlate
          type={plate.type}
          usageType={plate.usageType}
          shape={plate.shape}
          classification={plate.classification}
          lettersAr={plate.lettersAr}
          lettersEn={plate.lettersEn}
          numbers={plate.numbers}
          logo={plate.logo}
          size="lg"
          vip={plate.isVip}
          locale={locale}
        />
      </div>

      {blockedReason ? (
        <Card>
          <CardBody className="text-center text-sm text-(--color-danger)">{blockedReason}</CardBody>
        </Card>
      ) : (
        <UserAuctionForm plateId={plate._id} />
      )}
    </div>
  );
}
