import { connectDB } from "@/lib/db";
import { PlateLogo } from "@/models/PlateLogo";
import { SaudiPlate } from "@/components/plate/SaudiPlate";
import { toPlateLogoDTOList, type LeanPlateLogo } from "@/lib/dto";
import type { PlateClassification, PlateShape, UsageType } from "@/lib/constants";

/**
 * TEMPORARY visual harness for the plate renderer — not linked from
 * anywhere. Renders the combination matrix from the client brief so the
 * output can be put beside the reference sheet. Delete once signed off.
 */
export const revalidate = 0;

interface Case {
  label: string;
  usageType: UsageType;
  shape: PlateShape;
  classification: PlateClassification;
  numbers: string;
  logoIndex: number | null;
}

const CASES: Case[] = [
  { label: "خصوصي private + Wide", usageType: "private", shape: "wide", classification: "triple", numbers: "970", logoIndex: 0 },
  { label: "نقل عام/أجرة transport + Wide", usageType: "transport", shape: "wide", classification: "triple", numbers: "970", logoIndex: 0 },
  { label: "نقل خاص private_transport + Wide", usageType: "private_transport", shape: "wide", classification: "triple", numbers: "970", logoIndex: 0 },
  { label: "نقل تجاري commercial + Wide", usageType: "commercial", shape: "wide", classification: "quadruple", numbers: "7003", logoIndex: 0 },
  { label: "دبلوماسي diplomatic + Wide", usageType: "diplomatic", shape: "wide", classification: "triple", numbers: "970", logoIndex: 0 },
  { label: "مؤقت temporary + Wide", usageType: "temporary", shape: "wide", classification: "double", numbers: "77", logoIndex: 0 },
  { label: "رياضية sport + sport_small", usageType: "sport", shape: "small_sport", classification: "double", numbers: "77", logoIndex: 0 },
  { label: "خصوصي + Wide + NO LOGO", usageType: "private", shape: "wide", classification: "triple", numbers: "970", logoIndex: null },
  { label: "خصوصي + Square Small + Triple", usageType: "private", shape: "small_square", classification: "triple", numbers: "970", logoIndex: 0 },
  { label: "نقل تجاري commercial + Square Small", usageType: "commercial", shape: "small_square", classification: "quadruple", numbers: "7003", logoIndex: 0 },
  { label: "دبلوماسي + Square Small", usageType: "diplomatic", shape: "small_square", classification: "triple", numbers: "970", logoIndex: 0 },
  { label: "LEGACY (type only, no split fields)", usageType: "private", shape: "wide", classification: "triple", numbers: "970", logoIndex: 0 },
];

export default async function PlateMatrixPage() {
  await connectDB();
  const logoDocs = await PlateLogo.find({ isActive: true }).sort({ sortOrder: 1 }).lean<LeanPlateLogo[]>();
  const logos = toPlateLogoDTOList(logoDocs);

  return (
    <div className="min-h-screen bg-[#efeae1] p-8">
      <h1 className="mb-6 text-2xl font-bold text-[#27231f]">Plate renderer matrix ({logos.length} logos)</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {CASES.map((c) => {
          const isLegacy = c.label.startsWith("LEGACY");
          return (
            <div key={c.label} className="rounded-xl border border-[#ded5c8] bg-white p-5">
              <p className="mb-3 text-xs font-semibold text-[#655e55]">{c.label}</p>
              <SaudiPlate
                type="private"
                // The legacy row deliberately omits the split fields, to
                // prove a pre-migration record still draws.
                usageType={isLegacy ? null : c.usageType}
                shape={isLegacy ? null : c.shape}
                classification={isLegacy ? null : c.classification}
                lettersAr="ن ه ط"
                lettersEn="THN"
                numbers={c.numbers}
                logo={c.logoIndex !== null ? (logos[c.logoIndex] ?? null) : null}
                size="xl"
                locale="ar"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
