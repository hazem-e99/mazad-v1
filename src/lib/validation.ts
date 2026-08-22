import { z } from "zod";
import { PLATE_TYPES, AUCTION_CATEGORIES } from "@/lib/constants";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "معرّف غير صالح");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^05\d{8}$/, "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(100),
  phone: phoneSchema,
  password: z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف").max(100),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const plateSchema = z.object({
  type: z.enum(PLATE_TYPES),
  lettersAr: z.string().trim().min(1).max(10),
  lettersEn: z.string().trim().min(1).max(10),
  numbers: z.string().trim().regex(/^\d{1,4}$/, "الأرقام يجب أن تكون من 1 إلى 4 خانات"),
  image: z.string().min(1).nullable().optional(),
  // Admin-managed logo reference — a real ObjectId string, or null/absent
  // for "no logo". Existence + isActive are checked in the route handler
  // (DB-dependent, not expressible in a pure schema).
  logo: objectIdSchema.nullable().optional(),
  isVip: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  notes: z.string().trim().max(500).optional(),
});

export const plateLogoCreateSchema = z.object({
  nameAr: z.string().trim().min(1, "الاسم بالعربي مطلوب").max(100),
  nameEn: z.string().trim().min(1, "الاسم بالإنجليزي مطلوب").max(100),
  image: z.string().min(1, "صورة الشعار مطلوبة"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const plateLogoUpdateSchema = z.object({
  nameAr: z.string().trim().min(1).max(100).optional(),
  nameEn: z.string().trim().min(1).max(100).optional(),
  image: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const auctionSchema = z
  .object({
    plate: z.string().min(1, "اللوحة مطلوبة"),
    category: z.enum(AUCTION_CATEGORIES).default("regular"),
    startingPrice: z.number().min(0),
    minIncrement: z.number().min(1),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    directPurchaseEnabled: z.boolean().default(false),
    directPurchasePrice: z.number().min(0).nullable().optional(),
    backgroundImage: z.string().nullable().optional(),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "وقت الانتهاء يجب أن يكون بعد وقت البداية",
    path: ["endAt"],
  })
  .refine((data) => !data.directPurchaseEnabled || Boolean(data.directPurchasePrice), {
    message: "سعر الشراء المباشر مطلوب عند تفعيله",
    path: ["directPurchasePrice"],
  });

export const bidSchema = z.object({
  amount: z.number().positive("قيمة المزايدة يجب أن تكون أكبر من صفر"),
});
