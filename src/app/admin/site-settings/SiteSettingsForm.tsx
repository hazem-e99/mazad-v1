"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Input";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { validateUploadFile } from "@/lib/fileValidation";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteFooterSection,
  type SiteLink,
  type SiteManagedPage,
  type SiteNavItem,
  type SiteSettingsDTO,
  type SiteSocialLink,
} from "@/lib/siteSettings";
import { useToastStore } from "@/hooks/useToast";

type ImageField = "siteLogo" | "heroBackground" | "heroLogo" | "footerLogo" | "ogImage";
type ImageFiles = Record<ImageField, File | null>;

const emptyFiles: ImageFiles = {
  siteLogo: null,
  heroBackground: null,
  heroLogo: null,
  footerLogo: null,
  ogImage: null,
};

const platforms: SiteSocialLink["platform"][] = ["whatsapp", "x", "instagram", "snapchat", "tiktok", "email", "facebook", "youtube", "link"];
const audiences: SiteNavItem["audience"][] = ["always", "auth", "staff"];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function byId<T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

export function SiteSettingsForm({ initial }: { initial: SiteSettingsDTO }) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [settings, setSettings] = useState<SiteSettingsDTO>(initial);
  const [files, setFiles] = useState<ImageFiles>(emptyFiles);
  const [saving, setSaving] = useState(false);

  function pickImage(field: ImageField, file: File | null) {
    if (!file) return;
    const problem = validateUploadFile(file, (key, params) => {
      if (key === "validation.fileTypeInvalid") return "نوع الصورة غير مدعوم. استخدم PNG أو JPG أو WebP.";
      if (key === "validation.fileTooLarge") return `حجم الصورة أكبر من ${params?.max ?? 8}MB.`;
      return "الصورة غير صالحة.";
    });
    if (problem) {
      push(problem, "error");
      return;
    }
    setFiles((current) => ({ ...current, [field]: file }));
  }

  function resetImage(field: ImageField) {
    setFiles((current) => ({ ...current, [field]: null }));
    if (field === "siteLogo") {
      setSettings((current) => ({
        ...current,
        brand: {
          ...current.brand,
          logoUrl: DEFAULT_SITE_SETTINGS.brand.logoUrl,
          headerLogoUrl: DEFAULT_SITE_SETTINGS.brand.headerLogoUrl,
        },
      }));
    }
    if (field === "heroBackground") {
      setSettings((current) => ({ ...current, hero: { ...current.hero, backgroundImage: DEFAULT_SITE_SETTINGS.hero.backgroundImage } }));
    }
    if (field === "heroLogo") {
      setSettings((current) => ({ ...current, hero: { ...current.hero, logoUrl: DEFAULT_SITE_SETTINGS.hero.logoUrl } }));
    }
    if (field === "footerLogo") {
      setSettings((current) => ({ ...current, brand: { ...current.brand, footerLogoUrl: DEFAULT_SITE_SETTINGS.brand.footerLogoUrl } }));
    }
    if (field === "ogImage") {
      setSettings((current) => ({ ...current, seo: { ...current.seo, ogImage: DEFAULT_SITE_SETTINGS.seo.ogImage } }));
    }
  }

  function addManagedPageWithPolicyLink() {
    const page = newManagedPage();
    const link: SiteLink = {
      id: `link-${page.id}`,
      labelAr: page.titleAr,
      labelEn: page.titleEn,
      href: `/pages/${page.slug}`,
      enabled: true,
      sortOrder: 100,
    };

    setSettings((current) => {
      const policies = current.footer.sections.find((section) => section.id === "policies");
      const sections = policies
        ? current.footer.sections.map((section) =>
            section.id === "policies" ? { ...section, links: [...section.links, link], enabled: true } : section
          )
        : [
            ...current.footer.sections,
            {
              id: "policies",
              titleAr: "السياسات",
              titleEn: "Policies",
              enabled: true,
              sortOrder: 100,
              links: [link],
            },
          ];

      return {
        ...current,
        pages: [...current.pages, page],
        footer: { ...current.footer, sections },
      };
    });
  }

  async function upload(field: ImageField): Promise<string | null> {
    const file = files[field];
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subdir", "site-assets");
    const uploaded = await apiFetch<{ url: string }>("/api/uploads", {
      method: "POST",
      body: formData,
      silentErrors: true,
    });
    return uploaded.url;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const [siteLogo, heroBackground, heroLogo, footerLogo, ogImage] = await Promise.all([
        upload("siteLogo"),
        upload("heroBackground"),
        upload("heroLogo"),
        upload("footerLogo"),
        upload("ogImage"),
      ]);

      const payload: SiteSettingsDTO = {
        ...settings,
        brand: {
          ...settings.brand,
          logoUrl: siteLogo ?? settings.brand.logoUrl,
          headerLogoUrl: siteLogo ?? settings.brand.headerLogoUrl,
          footerLogoUrl: footerLogo ?? settings.brand.footerLogoUrl,
        },
        hero: {
          ...settings.hero,
          backgroundImage: heroBackground ?? settings.hero.backgroundImage,
          logoUrl: heroLogo ?? settings.hero.logoUrl,
        },
        seo: {
          ...settings.seo,
          ogImage: ogImage ?? settings.seo.ogImage,
        },
      };

      const saved = await apiFetch<SiteSettingsDTO>("/api/site-settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
        silentErrors: true,
      });
      setSettings(saved);
      setFiles(emptyFiles);
      push("تم حفظ إعدادات الموقع", "success");
      router.refresh();
    } catch (err) {
      push(err instanceof ApiClientError ? err.message : "تعذر حفظ إعدادات الموقع", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Card>
        <CardBody className="grid gap-5 lg:grid-cols-2">
          <ImageDropzone
            id="site-logo"
            label="لوجو الموقع والناف بار"
            existingUrl={settings.brand.headerLogoUrl || settings.brand.logoUrl}
            file={files.siteLogo}
            onPick={(file) => pickImage("siteLogo", file)}
            onRemove={() => resetImage("siteLogo")}
            disabled={saving}
          />
          <ImageDropzone
            id="hero-bg"
            label="صورة الهيرو"
            existingUrl={settings.hero.backgroundImage}
            file={files.heroBackground}
            onPick={(file) => pickImage("heroBackground", file)}
            onRemove={() => resetImage("heroBackground")}
            disabled={saving}
          />
          <ImageDropzone
            id="hero-logo"
            label="لوجو الهيرو"
            existingUrl={settings.hero.logoUrl}
            file={files.heroLogo}
            onPick={(file) => pickImage("heroLogo", file)}
            onRemove={() => resetImage("heroLogo")}
            disabled={saving}
          />
          <ImageDropzone
            id="footer-logo"
            label="لوجو الفوتر"
            existingUrl={settings.brand.footerLogoUrl}
            file={files.footerLogo}
            onPick={(file) => pickImage("footerLogo", file)}
            onRemove={() => resetImage("footerLogo")}
            disabled={saving}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <SectionTitle title="الهيرو" action={null} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="عنوان الهيرو بالعربي" value={settings.hero.titleAr} onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, titleAr: e.target.value } })} />
            <Input label="Hero title in English" value={settings.hero.titleEn} dir="ltr" onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, titleEn: e.target.value } })} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-5">
          <SectionTitle title="إعدادات SEO" action={null} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="اسم الموقع بالعربي" value={settings.seo.siteNameAr} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, siteNameAr: e.target.value } })} />
            <Input label="Site name in English" value={settings.seo.siteNameEn} dir="ltr" onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, siteNameEn: e.target.value } })} />
            <Input label="عنوان SEO بالعربي" value={settings.seo.titleAr} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, titleAr: e.target.value } })} />
            <Input label="SEO title in English" value={settings.seo.titleEn} dir="ltr" onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, titleEn: e.target.value } })} />
            <Textarea label="وصف SEO بالعربي" value={settings.seo.descriptionAr} rows={3} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, descriptionAr: e.target.value } })} />
            <Textarea label="SEO description in English" value={settings.seo.descriptionEn} rows={3} dir="ltr" onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, descriptionEn: e.target.value } })} />
            <Input label="الكلمات المفتاحية بالعربي" value={settings.seo.keywordsAr} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, keywordsAr: e.target.value } })} />
            <Input label="Keywords in English" value={settings.seo.keywordsEn} dir="ltr" onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, keywordsEn: e.target.value } })} />
            <Input label="Canonical URL" value={settings.seo.canonicalUrl} dir="ltr" placeholder="https://example.com" onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, canonicalUrl: e.target.value } })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox label="السماح بالأرشفة" checked={settings.seo.robotsIndex} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, robotsIndex: e.target.checked } })} />
              <Checkbox label="السماح بتتبع الروابط" checked={settings.seo.robotsFollow} onChange={(e) => setSettings({ ...settings, seo: { ...settings.seo, robotsFollow: e.target.checked } })} />
            </div>
          </div>

          <ImageDropzone
            id="seo-og-image"
            label="صورة المشاركة Open Graph"
            existingUrl={settings.seo.ogImage}
            file={files.ogImage}
            onPick={(file) => pickImage("ogImage", file)}
            onRemove={() => resetImage("ogImage")}
            disabled={saving}
            hint="الصورة التي تظهر عند مشاركة رابط الموقع"
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <SectionTitle title="الناف بار / المنيو" action={<Button type="button" variant="secondary" size="sm" onClick={() => setSettings({ ...settings, navItems: [...settings.navItems, newNavItem()] })}><Plus className="h-4 w-4" />إضافة لينك</Button>} />
          <div className="flex flex-col gap-3">
            {settings.navItems.map((item) => (
              <NavItemEditor key={item.id} item={item} onChange={(patch) => setSettings({ ...settings, navItems: byId(settings.navItems, item.id, patch) })} onRemove={() => setSettings({ ...settings, navItems: removeById(settings.navItems, item.id) })} />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <SectionTitle title="الفوتر" action={<Button type="button" variant="secondary" size="sm" onClick={() => setSettings({ ...settings, footer: { ...settings.footer, sections: [...settings.footer.sections, newFooterSection()] } })}><Plus className="h-4 w-4" />إضافة قسم</Button>} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="نص الفوتر بالعربي" value={settings.footer.taglineAr} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, taglineAr: e.target.value } })} />
            <Input label="Footer text in English" value={settings.footer.taglineEn} dir="ltr" onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, taglineEn: e.target.value } })} />
            <Input label="حقوق النشر بالعربي" value={settings.footer.copyrightAr} onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, copyrightAr: e.target.value } })} />
            <Input label="Copyright in English" value={settings.footer.copyrightEn} dir="ltr" onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, copyrightEn: e.target.value } })} />
          </div>

          <div className="flex flex-col gap-4">
            {settings.footer.sections.map((section) => (
              <FooterSectionEditor
                key={section.id}
                section={section}
                onChange={(patch) => setSettings({ ...settings, footer: { ...settings.footer, sections: byId(settings.footer.sections, section.id, patch) } })}
                onRemove={() => setSettings({ ...settings, footer: { ...settings.footer, sections: removeById(settings.footer.sections, section.id) } })}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <SectionTitle title="روابط السوشيال" action={<Button type="button" variant="secondary" size="sm" onClick={() => setSettings({ ...settings, footer: { ...settings.footer, socials: [...settings.footer.socials, newSocialLink()] } })}><Plus className="h-4 w-4" />إضافة سوشيال</Button>} />
          <div className="flex flex-col gap-3">
            {settings.footer.socials.map((social) => (
              <SocialEditor key={social.id} social={social} onChange={(patch) => setSettings({ ...settings, footer: { ...settings.footer, socials: byId(settings.footer.socials, social.id, patch) } })} onRemove={() => setSettings({ ...settings, footer: { ...settings.footer, socials: removeById(settings.footer.socials, social.id) } })} />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <SectionTitle title="صفحات الفوتر" action={<Button type="button" variant="secondary" size="sm" onClick={addManagedPageWithPolicyLink}><Plus className="h-4 w-4" />إضافة صفحة</Button>} />
          <div className="flex flex-col gap-4">
            {settings.pages.map((page) => (
              <PageEditor key={page.id} page={page} onChange={(patch) => setSettings({ ...settings, pages: byId(settings.pages, page.id, patch) })} onRemove={() => setSettings({ ...settings, pages: removeById(settings.pages, page.id) })} />
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" variant="gold" size="lg" loading={saving} disabled={saving}>
          <Save className="h-4 w-4" />
          حفظ إعدادات الموقع
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({ title, action }: { title: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-(--color-text)">{title}</h2>
      {action}
    </div>
  );
}

function NavItemEditor({ item, onChange, onRemove }: { item: SiteNavItem; onChange: (patch: Partial<SiteNavItem>) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-4 lg:grid-cols-[1fr_1fr_1.2fr_.8fr_.7fr_auto]">
      <Input label="العنوان" value={item.labelAr} onChange={(e) => onChange({ labelAr: e.target.value })} />
      <Input label="Title" value={item.labelEn} dir="ltr" onChange={(e) => onChange({ labelEn: e.target.value })} />
      <Input label="الرابط" value={item.href} dir="ltr" onChange={(e) => onChange({ href: e.target.value })} />
      <Select label="الظهور" value={item.audience} onChange={(e) => onChange({ audience: e.target.value as SiteNavItem["audience"] })}>
        {audiences.map((audience) => (
          <option key={audience} value={audience}>{audience}</option>
        ))}
      </Select>
      <Input label="الترتيب" type="number" value={item.sortOrder} onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })} />
      <EditorActions enabled={item.enabled} onEnabled={(enabled) => onChange({ enabled })} onRemove={onRemove} />
    </div>
  );
}

function FooterSectionEditor({ section, onChange, onRemove }: { section: SiteFooterSection; onChange: (patch: Partial<SiteFooterSection>) => void; onRemove: () => void }) {
  const updateLink = (linkId: string, patch: Partial<SiteLink>) => onChange({ links: byId(section.links, linkId, patch) });
  return (
    <div className="flex flex-col gap-4 rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_.6fr_auto]">
        <Input label="عنوان القسم" value={section.titleAr} onChange={(e) => onChange({ titleAr: e.target.value })} />
        <Input label="Section title" value={section.titleEn} dir="ltr" onChange={(e) => onChange({ titleEn: e.target.value })} />
        <Input label="الترتيب" type="number" value={section.sortOrder} onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })} />
        <EditorActions enabled={section.enabled} onEnabled={(enabled) => onChange({ enabled })} onRemove={onRemove} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-(--color-text)">روابط القسم</h3>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange({ links: [...section.links, newFooterLink()] })}><Plus className="h-4 w-4" />إضافة رابط</Button>
      </div>
      <div className="flex flex-col gap-2">
        {section.links.map((link) => (
          <div key={link.id} className="grid gap-2 rounded-(--radius-md) border border-(--color-border) p-3 lg:grid-cols-[1fr_1fr_1.2fr_.6fr_auto]">
            <Input label="العنوان" value={link.labelAr} onChange={(e) => updateLink(link.id, { labelAr: e.target.value })} />
            <Input label="Title" value={link.labelEn} dir="ltr" onChange={(e) => updateLink(link.id, { labelEn: e.target.value })} />
            <Input label="الرابط" value={link.href} dir="ltr" onChange={(e) => updateLink(link.id, { href: e.target.value })} />
            <Input label="الترتيب" type="number" value={link.sortOrder} onChange={(e) => updateLink(link.id, { sortOrder: Number(e.target.value) || 0 })} />
            <EditorActions enabled={link.enabled} onEnabled={(enabled) => updateLink(link.id, { enabled })} onRemove={() => onChange({ links: removeById(section.links, link.id) })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialEditor({ social, onChange, onRemove }: { social: SiteSocialLink; onChange: (patch: Partial<SiteSocialLink>) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-4 lg:grid-cols-[.8fr_1fr_1.5fr_.6fr_auto]">
      <Select label="المنصة" value={social.platform} onChange={(e) => onChange({ platform: e.target.value as SiteSocialLink["platform"] })}>
        {platforms.map((platform) => (
          <option key={platform} value={platform}>{platform}</option>
        ))}
      </Select>
      <Input label="العنوان" value={social.label} onChange={(e) => onChange({ label: e.target.value })} />
      <Input label="الرابط" value={social.href} dir="ltr" onChange={(e) => onChange({ href: e.target.value })} />
      <Input label="الترتيب" type="number" value={social.sortOrder} onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })} />
      <EditorActions enabled={social.enabled} onEnabled={(enabled) => onChange({ enabled })} onRemove={onRemove} />
    </div>
  );
}

function PageEditor({ page, onChange, onRemove }: { page: SiteManagedPage; onChange: (patch: Partial<SiteManagedPage>) => void; onRemove: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-bg-elevated) p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_.6fr_auto]">
        <Input label="عنوان الصفحة" value={page.titleAr} onChange={(e) => onChange({ titleAr: e.target.value })} />
        <Input label="Page title" value={page.titleEn} dir="ltr" onChange={(e) => onChange({ titleEn: e.target.value })} />
        <Input label="Slug" value={page.slug} dir="ltr" onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
        <Input label="الترتيب" type="number" value={page.sortOrder} onChange={(e) => onChange({ sortOrder: Number(e.target.value) || 0 })} />
        <EditorActions enabled={page.enabled} onEnabled={(enabled) => onChange({ enabled })} onRemove={onRemove} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Textarea label="المحتوى بالعربي" value={page.contentAr} rows={7} onChange={(e) => onChange({ contentAr: e.target.value })} />
        <Textarea label="Content in English" value={page.contentEn} rows={7} dir="ltr" onChange={(e) => onChange({ contentEn: e.target.value })} />
      </div>
      <p className="text-xs text-(--color-text-faint)">الرابط العام للصفحة: /pages/{page.slug || "slug"}</p>
    </div>
  );
}

function EditorActions({ enabled, onEnabled, onRemove }: { enabled: boolean; onEnabled: (enabled: boolean) => void; onRemove: () => void }) {
  return (
    <div className="flex items-end gap-2">
      <Checkbox label="نشط" checked={enabled} onChange={(e) => onEnabled(e.target.checked)} className="min-h-11 flex-1 py-2.5" />
      <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label="حذف">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function newNavItem(): SiteNavItem {
  const id = makeId("nav");
  return { id, labelAr: "رابط جديد", labelEn: "New Link", href: "/", audience: "always", enabled: true, sortOrder: 100 };
}

function newFooterSection(): SiteFooterSection {
  const id = makeId("section");
  return { id, titleAr: "قسم جديد", titleEn: "New Section", enabled: true, sortOrder: 100, links: [] };
}

function newFooterLink(): SiteLink {
  const id = makeId("link");
  return { id, labelAr: "رابط جديد", labelEn: "New Link", href: "/", enabled: true, sortOrder: 0 };
}

function newSocialLink(): SiteSocialLink {
  const id = makeId("social");
  return { id, platform: "link", label: "Link", href: "/", enabled: true, sortOrder: 100 };
}

function newManagedPage(): SiteManagedPage {
  const id = makeId("page");
  return {
    id,
    titleAr: "صفحة جديدة",
    titleEn: "New Page",
    slug: id,
    contentAr: "",
    contentEn: "",
    enabled: true,
    sortOrder: 100,
  };
}
