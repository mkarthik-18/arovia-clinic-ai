import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader, Panel } from "@/components/common/page";
import { Field } from "@/components/appointments/appointment-form-dialog";
import { AroviaMark } from "@/components/brand/logo";
import { settingsService, useClinic } from "@/services/demo/store";
import type { ClinicSettings } from "@/types/clinic";

const TABS = ["clinic", "whatsapp", "assistant", "notifications", "profile"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/settings")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => ({
    tab: TABS.includes(s["tab"] as Tab) ? (s["tab"] as Tab) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Settings — Arovia Healthcare Dashboard" },
      { name: "description", content: "Clinic profile, WhatsApp, AI receptionist and notification settings." },
      { property: "og:title", content: "Settings — Arovia Healthcare Dashboard" },
      { property: "og:description", content: "Clinic profile, WhatsApp, AI receptionist and notification settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const LANGS = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Marathi"];

function SettingsPage() {
  const { tab = "clinic" } = Route.useSearch();
  const navigate = useNavigate();
  const saved = useClinic((s) => s.settings);
  const [draft, setDraft] = useState<ClinicSettings>(saved);
  useEffect(() => setDraft(saved), [saved]);
  const set = <K extends keyof ClinicSettings>(k: K, v: ClinicSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const save = () => {
    if (!draft.clinicName.trim()) {
      toast.error("Clinic name is required");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(draft.email) || !/^\S+@\S+\.\S+$/.test(draft.adminEmail)) {
      toast.error("Enter valid email addresses");
      return;
    }
    settingsService.update(draft);
    toast.success("Settings saved");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Configure your clinic, integrations and Arovia Assistant."
        actions={
          <>
            <Button variant="outline" size="sm" disabled={!dirty} onClick={() => setDraft(saved)}>Discard</Button>
            <Button size="sm" disabled={!dirty} onClick={save}>Save changes</Button>
          </>
        }
      />
      <Tabs value={tab} onValueChange={(v) => navigate({ to: "/settings", search: { tab: v as Tab }, replace: true })}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="clinic">Clinic profile</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="assistant">AI receptionist</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Admin profile</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="mt-6">
          <Panel title="Clinic profile" description="Shown to patients in WhatsApp replies and confirmations.">
            <div className="mb-6 flex items-center gap-4">
              <AroviaMark className="size-14" />
              <div className="text-sm text-muted-foreground">Logo uploads are enabled once file storage is connected.</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Clinic name"><Input value={draft.clinicName} onChange={(e) => set("clinicName", e.target.value)} /></Field>
              <Field label="Phone"><Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Address" className="sm:col-span-2"><Textarea rows={2} value={draft.address} onChange={(e) => set("address", e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Website"><Input value={draft.website} onChange={(e) => set("website", e.target.value)} /></Field>
              <Field label="Google Maps URL"><Input value={draft.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} /></Field>
              <Field label="Time zone">
                <Select value={draft.timeZone} onValueChange={(v) => set("timeZone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">India (IST, UTC+5:30)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GST, UTC+4)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <Panel title="WhatsApp integration" description="Patients message this number to reach Arovia Assistant.">
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-neutral" />
              <div className="text-sm">
                <div className="font-medium">Not connected</div>
                <p className="text-muted-foreground">
                  WhatsApp is linked in a later stage, together with the automation that runs Arovia Assistant. Access
                  tokens are stored securely on the server and are never shown here.
                </p>
              </div>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {[
                ["WhatsApp Business number", "—"],
                ["Connection status", "Not connected"],
                ["Meta Phone Number ID", "—"],
                ["WhatsApp Business Account ID", "—"],
                ["Webhook status", "Not configured"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </TabsContent>

        <TabsContent value="assistant" className="mt-6">
          <Panel title="Arovia Assistant" description="How the AI receptionist greets and helps patients.">
            <div className="grid gap-5">
              <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-medium">Assistant active</div>
                  <div className="text-xs text-muted-foreground">When off, patients are told the front desk will reply.</div>
                </div>
                <Switch checked={draft.assistantActive} onCheckedChange={(v) => set("assistantActive", v)} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Assistant name"><Input value={draft.assistantName} onChange={(e) => set("assistantName", e.target.value)} /></Field>
              </div>
              <Field label="Welcome message">
                <Textarea rows={3} maxLength={500} value={draft.welcomeMessage} onChange={(e) => set("welcomeMessage", e.target.value)} />
              </Field>
              <Field label="Supported languages">
                <div className="flex flex-wrap gap-3 rounded-md border p-3">
                  {LANGS.map((l) => (
                    <label key={l} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={draft.languages.includes(l)}
                        onCheckedChange={(on) => set("languages", on ? [...draft.languages, l] : draft.languages.filter((x) => x !== l))}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </Field>
              <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <div className="text-sm font-medium">Human handoff</div>
                  <div className="text-xs text-muted-foreground">Flag the chat for staff when a patient asks for a person.</div>
                </div>
                <Switch checked={draft.humanHandoff} onCheckedChange={(v) => set("humanHandoff", v)} />
              </label>
              {draft.humanHandoff && (
                <Field label="Handoff phrase">
                  <Input value={draft.handoffKeyword} onChange={(e) => set("handoffKeyword", e.target.value)} />
                </Field>
              )}
              <p className="text-xs text-muted-foreground">
                Business hours follow the schedule on the Availability page.
              </p>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Panel title="Patient notifications" description="WhatsApp messages sent automatically once WhatsApp is connected.">
            <div className="divide-y">
              {([
                ["notifyConfirmation", "Booking confirmation", "Sent right after an appointment is booked."],
                ["notifyReminder", "Appointment reminders", "Sent the evening before the visit."],
                ["notifyCancellation", "Cancellation", "Sent when the clinic or patient cancels."],
                ["notifyReschedule", "Rescheduling", "Sent when the date or time changes."],
              ] as const).map(([k, title, desc]) => (
                <label key={k} className="flex items-center justify-between gap-4 py-3.5">
                  <div>
                    <div className="text-sm font-medium">{title}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                  <Switch checked={draft[k]} onCheckedChange={(v) => set(k, v)} />
                </label>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <Panel title="Admin profile">
            <div className="mb-6 flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground">AD</span>
              <div className="text-sm">
                <div className="font-medium">{saved.adminName}</div>
                <div className="text-muted-foreground">{saved.adminEmail}</div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><Input value={draft.adminName} onChange={(e) => set("adminName", e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={draft.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} /></Field>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Google account</div>
                  <div className="text-xs text-muted-foreground">Not linked — Google sign-in is enabled with the secure backend.</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/login" })}>
                <LogOut className="size-3.5" /> Log out
              </Button>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
