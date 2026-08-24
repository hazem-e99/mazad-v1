import { z } from "zod";
import { isValidPlateLettersAr, deriveLettersEn } from "@/lib/plateLetters";
import { MESSAGES, DEFAULT_LOCALE, resolveMessage, type Locale } from "@/lib/i18n";
import {
  PLATE_TYPES,
  AUCTION_CATEGORIES,
  PLATE_CLASSIFICATIONS,
  USAGE_TYPES,
  PLATE_SHAPES,
  PLATE_SIZES,
  SUBMISSION_TYPES,
  MODERATION_STATUSES,
} from "@/lib/constants";

/**
 * One definition of every input rule, parameterised by a translator.
 *
 * The same factory is used by the API routes (with the request's locale)
 * and by the forms (with the page's locale), so a field can never be
 * accepted by the browser and rejected by the server — and the message a
 * user reads is always in the language they are reading the page in.
 */
export type Translate = (key: string, params?: Record<string, string | number>) => string;

export function translatorFor(locale: Locale): Translate {
  return (key, params) => resolveMessage(MESSAGES[locale], key, params);
}

/** Longest plausible amount, to reject overflow/typo values like 1e21. */
const MAX_AMOUNT = 1_000_000_000;

/** Minimum auction duration; anything shorter is a mis-entered date. */
export const MIN_AUCTION_DURATION_MS = 60_000;

export function buildSchemas(t: Translate) {
  const v = (key: string, params?: Record<string, string | number>) => t("validation." + key, params);

  /** A number field that reports a readable message for NaN/undefined
   * instead of Zod's "expected number, received NaN". */
  const amount = (messageKey: string, opts: { min?: number; allowZero?: boolean } = {}) =>
    z
      .number({ error: () => v(messageKey) })
      .refine((n) => Number.isFinite(n), { message: v("numberInvalid") })
      .refine((n) => (opts.allowZero ? n >= 0 : n > 0), { message: v(messageKey) })
      .refine((n) => (opts.min == null ? true : n >= opts.min), { message: v(messageKey) })
      .refine((n) => n <= MAX_AMOUNT, { message: v("priceTooLarge") });

  const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, v("invalidId"));

  /** Account phone: Saudi mobile in local 05XXXXXXXX form. */
  const phone = z
    .string({ error: () => v("phoneRequired") })
    .trim()
    .min(1, v("phoneRequired"))
    .regex(/^05\d{8}$/, v("phoneInvalid"));

  /** A listing's contact number may differ from the account's own, and is
   * commonly pasted in +966/966 form, so all three shapes are accepted. */
  const contactPhone = z
    .string({ error: () => v("phoneRequired") })
    .trim()
    .min(1, v("phoneRequired"))
    .regex(/^(05\d{8}|\+9665\d{8}|9665\d{8})$/, v("contactPhoneInvalid"));

  const email = z.string().trim().email(v("emailInvalid"));
  const optionalEmail = z.union([email, z.literal("")]).optional();

  const socialHandle = z.string().trim().max(60, v("handleTooLong")).optional();

  // Whitelisted against the 15 letters an official Saudi plate can
  // actually carry (see plateLetters.ts), not just "any Arabic text" the
  // old regex accepted. lettersEn is intentionally *not* a schema field
  // anywhere below: it is derived from lettersAr through the one official
  // mapping — see deriveLettersEn() and its callers in the route handlers
  // — so a caller can never send `{ lettersAr: "...", lettersEn: "ANYTHING" }`
  // and have the mismatch stick.
  const lettersAr = z
    .string({ error: () => v("lettersArRequired") })
    .trim()
    .min(1, v("lettersArRequired"))
    .max(12, v("lettersTooLong"))
    .refine(isValidPlateLettersAr, v("lettersArInvalid"));

  const plateNumbers = z
    .string({ error: () => v("numbersRequired") })
    .trim()
    .min(1, v("numbersRequired"))
    .regex(/^\d{1,4}$/, v("numbersInvalid"));

  const title = z
    .string({ error: () => v("titleRequired") })
    .trim()
    .min(1, v("titleRequired"))
    .min(2, v("titleTooShort"))
    .max(150, v("titleTooLong"));

  const description = z.string().trim().max(2000, v("descriptionTooLong")).optional();

  const sortOrder = z.number().int(v("sortOrderInteger"));

  /** datetime-local / ISO strings. z.coerce.date() turns an unparseable
   * value into an Invalid Date whose default message is unreadable. */
  const dateField = z
    .union([z.string(), z.date()])
    .transform((value) => (value instanceof Date ? value : new Date(value)))
    .refine((d) => !Number.isNaN(d.getTime()), { message: v("dateInvalid") });

  const objectIdSchema = objectId;
  const phoneSchema = phone;

  const registerSchema = z.object({
    name: z
      .string({ error: () => v("nameRequired") })
      .trim()
      .min(1, v("nameRequired"))
      .min(2, v("nameTooShort"))
      .max(100, v("nameTooLong")),
    phone: phoneSchema,
    password: z
      .string({ error: () => v("passwordRequired") })
      .min(8, v("passwordTooShort"))
      .max(100, v("passwordTooLong")),
  });

  const loginSchema = z.object({
    phone: phoneSchema,
    password: z.string({ error: () => v("passwordRequired") }).min(1, v("passwordRequired")),
  });

  /**
   * Attaches the Latin letters the Arabic ones transliterate to.
   *
   * Applied as a schema transform rather than in each route handler so
   * every write path — admin create, listing submit, listing update —
   * gets it from one place and none can forget. `lettersAr` has already
   * been refined against the plate letter set by this point, so the
   * derivation cannot fail; the fallback is defensive only.
   */
  const withDerivedLettersEn = <T extends { lettersAr?: string }>(data: T) => ({
    ...data,
    ...(data.lettersAr ? { lettersEn: deriveLettersEn(data.lettersAr) ?? "" } : {}),
  });

  // Kept as the bare object (not the transformed `plateSchema` below) so
  // `.partial()` still exists on it — ZodEffects, what `.transform()`
  // returns, drops that method entirely, which made
  // `plateSchema.partial()` a runtime TypeError the moment the letters
  // derivation was added. Every caller needing a partial update schema
  // must build from this one, never from the transformed export.
  const plateBaseSchema = z.object({
    type: z.enum(PLATE_TYPES, { error: () => v("plateTypeRequired") }),
    lettersAr,
    numbers: plateNumbers,
    image: z.string().min(1, v("imageRequired")).nullable().optional(),
    // Admin-managed logo reference — a real ObjectId string, or null/absent
    // for "no logo". Existence + isActive are checked in the route handler
    // (DB-dependent, not expressible in a pure schema).
    logo: objectId.nullable().optional(),
    isVip: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    notes: z.string().trim().max(500, v("tooLong", { max: 500 })).optional(),
  });

  const plateSchema = plateBaseSchema.transform(withDerivedLettersEn);

  /** For PATCH /api/plates/[id]: every field optional, but a lettersAr
   * that *is* sent still goes through the full derivation — a plate
   * cannot end up with English letters that no longer match its Arabic
   * ones just because the request only meant to touch the notes field. */
  const plateUpdateSchema = plateBaseSchema.partial().transform(withDerivedLettersEn);

  /* A category's artwork is optional, unlike a plate logo's: categories
     predate the field, and the home tiles fall back to a default icon. The
     value is the public path returned by /api/uploads — `null` explicitly
     clears it, which is how the admin's "remove image" control works. */
  const categoryImage = z.string().trim().min(1, v("categoryImageInvalid")).nullable().optional();

  const plateCategoryCreateSchema = z.object({
    nameAr: z.string().trim().min(1, v("nameArRequired")).max(100, v("nameTooLong")),
    nameEn: z.string().trim().min(1, v("nameEnRequired")).max(100, v("nameTooLong")),
    image: categoryImage,
    isActive: z.boolean().default(true),
    sortOrder: sortOrder.default(0),
  });

  const plateCategoryUpdateSchema = z.object({
    nameAr: z.string().trim().min(1, v("nameArRequired")).max(100, v("nameTooLong")).optional(),
    nameEn: z.string().trim().min(1, v("nameEnRequired")).max(100, v("nameTooLong")).optional(),
    image: categoryImage,
    isActive: z.boolean().optional(),
    sortOrder: sortOrder.optional(),
  });

  /**
   * The public "أضف لوحتك" submission flow — a real marketplace listing or
   * auction request, not the bare admin/legacy plate-identity creation
   * (see plateSchema above, still used by /admin/plates/new).
   */
  const listingFieldsSchema = z.object({
    type: z.enum(PLATE_TYPES, { error: () => v("plateTypeRequired") }),
    lettersAr,
    numbers: plateNumbers,
    logo: objectId.nullable().optional(),
    classification: z.enum(PLATE_CLASSIFICATIONS, { error: () => v("selectRequired") }).nullable().optional(),
    usageType: z.enum(USAGE_TYPES, { error: () => v("selectRequired") }).nullable().optional(),
    shape: z.enum(PLATE_SHAPES, { error: () => v("selectRequired") }).nullable().optional(),
    size: z.enum(PLATE_SIZES, { error: () => v("selectRequired") }).nullable().optional(),
    category: objectId.nullable().optional(),
    title,
    description,
    price: amount("pricePositive").nullable().optional(),
    image: z.string().min(1, v("plateImageRequired")),
    ownershipDocument: z.string().min(1).optional(),
    contactPhone,
    contactEmail: optionalEmail,
    instagram: socialHandle,
    tiktok: socialHandle,
    snapchat: socialHandle,
    submissionType: z.enum(SUBMISSION_TYPES, { error: () => v("submissionTypeRequired") }),
  });

  const listingSubmitSchema = listingFieldsSchema
    .refine(
      (data) => data.submissionType !== "marketplace" || (data.price != null && data.price > 0),
      { message: v("priceRequired"), path: ["price"] }
    )
    .transform(withDerivedLettersEn);

  const listingUpdateSchema = listingFieldsSchema.partial().transform(withDerivedLettersEn);

  const moderationDecisionSchema = z
    .object({
      status: z.enum(MODERATION_STATUSES, { error: () => v("selectRequired") }),
      rejectionReason: z.string().trim().max(500, v("tooLong", { max: 500 })).optional(),
    })
    .refine((data) => data.status !== "rejected" || Boolean(data.rejectionReason), {
      message: v("rejectionReasonRequired"),
      path: ["rejectionReason"],
    });

  const plateLogoCreateSchema = z.object({
    nameAr: z.string().trim().min(1, v("nameArRequired")).max(100, v("nameTooLong")),
    nameEn: z.string().trim().min(1, v("nameEnRequired")).max(100, v("nameTooLong")),
    image: z.string().min(1, v("logoImageRequired")),
    isActive: z.boolean().default(true),
    sortOrder: sortOrder.default(0),
  });

  const plateLogoUpdateSchema = z.object({
    nameAr: z.string().trim().min(1, v("nameArRequired")).max(100, v("nameTooLong")).optional(),
    nameEn: z.string().trim().min(1, v("nameEnRequired")).max(100, v("nameTooLong")).optional(),
    image: z.string().min(1, v("logoImageRequired")).optional(),
    isActive: z.boolean().optional(),
    sortOrder: sortOrder.optional(),
  });

  const auctionSchema = z
    .object({
      plate: z.string({ error: () => v("plateRequired") }).min(1, v("plateRequired")),
      category: z.enum(AUCTION_CATEGORIES, { error: () => v("selectRequired") }).default("regular"),
      startingPrice: amount("startingPriceNotNegative", { allowZero: true }),
      minIncrement: amount("minIncrementMin", { min: 1 }),
      startAt: dateField,
      endAt: dateField,
      directPurchaseEnabled: z.boolean().default(false),
      directPurchasePrice: amount("pricePositive").nullable().optional(),
      backgroundImage: z.string().nullable().optional(),
    })
    .refine((data) => data.endAt > data.startAt, {
      message: v("endBeforeStart"),
      path: ["endAt"],
    })
    .refine((data) => data.endAt.getTime() - data.startAt.getTime() >= MIN_AUCTION_DURATION_MS, {
      message: v("durationTooShort"),
      path: ["endAt"],
    })
    .refine((data) => data.endAt.getTime() > Date.now(), {
      message: v("endInPast"),
      path: ["endAt"],
    })
    .refine((data) => !data.directPurchaseEnabled || Boolean(data.directPurchasePrice), {
      message: v("directPurchaseRequired"),
      path: ["directPurchasePrice"],
    })
    .refine(
      (data) =>
        !data.directPurchaseEnabled ||
        data.directPurchasePrice == null ||
        data.directPurchasePrice > data.startingPrice,
      { message: v("directPurchaseAboveStart"), path: ["directPurchasePrice"] }
    );

  const bidSchema = z.object({
    amount: amount("bidPositive"),
  });

  const createAdSchema = z.object({
    title,
    description: z.string().trim().max(1000, v("tooLong", { max: 1000 })).optional(),
    image: z.string().min(1, v("imageRequired")),
    price: amount("pricePositive").optional(),
    contactPhone,
  });

  const chatMessageSchema = z.object({
    text: z
      .string({ error: () => v("messageRequired") })
      .trim()
      .min(1, v("messageRequired"))
      .max(500, v("messageTooLong")),
  });

  return {
    objectIdSchema,
    phoneSchema,
    contactPhoneSchema: contactPhone,
    emailSchema: email,
    registerSchema,
    loginSchema,
    plateSchema,
    plateCategoryCreateSchema,
    plateCategoryUpdateSchema,
    listingFieldsSchema,
    listingSubmitSchema,
    listingUpdateSchema,
    moderationDecisionSchema,
    plateLogoCreateSchema,
    plateLogoUpdateSchema,
    auctionSchema,
    bidSchema,
    createAdSchema,
    chatMessageSchema,
  };
}

export type Schemas = ReturnType<typeof buildSchemas>;

/**
 * Default (Arabic) instances. Every existing import site keeps working
 * unchanged; routes that want the caller's own language use
 * getLocalizedSchemas() instead.
 */
const defaultSchemas = buildSchemas(translatorFor(DEFAULT_LOCALE));

export const {
  objectIdSchema,
  phoneSchema,
  contactPhoneSchema,
  emailSchema,
  registerSchema,
  loginSchema,
  plateSchema,
  plateCategoryCreateSchema,
  plateCategoryUpdateSchema,
  listingFieldsSchema,
  listingSubmitSchema,
  listingUpdateSchema,
  moderationDecisionSchema,
  plateLogoCreateSchema,
  plateLogoUpdateSchema,
  auctionSchema,
  bidSchema,
  createAdSchema,
  chatMessageSchema,
} = defaultSchemas;

/**
 * Schemas for an explicit locale. Server code reaches these through
 * getLocalizedSchemas() in validation-server.ts, which resolves the
 * request's locale first — this module stays free of next/headers so it
 * can also be imported by client components.
 */
export function schemasForLocale(locale: Locale): Schemas {
  if (locale === DEFAULT_LOCALE) return defaultSchemas;
  return buildSchemas(translatorFor(locale));
}
