import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Clock, Pencil, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageContainer, PageHeader, Panel } from "@/components/common/page";
import { Field } from "@/components/appointments/appointment-form-dialog";
import { serviceService, useClinic } from "@/services/demo/store";
import { formatINR } from "@/lib/format";
import type { Service } from "@/types/clinic";

export const Route = createFileRoute("/services")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Services — Arovia Healthcare Dashboard" },
      { name: "description", content: "Consultations and treatments Arovia Clinic offers, with durations, fees and doctors." },
      { property: "og:title", content: "Services — Arovia Healthcare Dashboard" },
      { property: "og:description", content: "Consultations and treatments Arovia Clinic offers, with durations, fees and doctors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const services = useClinic((s) => s.services);
  const doctors = useClinic((s) => s.doctors);
  const [editing, setEditing] = useState<Service | "new" | null>(null);

  return (
    <PageContainer>
      <PageHeader
        title="Services"
        subtitle="Arovia Assistant only offers active services to patients."
        actions={<Button size="sm" onClick={() => setEditing("new")}><Plus className="size-3.5" /> Add service</Button>}
      />
      <Panel bodyClassName="p-0">
        {services.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No services yet" description="Add the consultations your clinic offers." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs hover:bg-transparent">
                  <TableHead className="pl-5">Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Doctors</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="pr-5"><span className="sr-only">Edit</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id} className="text-sm">
                    <TableCell className="max-w-sm pl-5">
                      <div className="font-medium text-foreground">{s.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{s.description}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {s.durationMinutes} min</span>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatINR(s.price)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.doctorIds.map((id) => (
                          <span key={id} className="rounded-md bg-muted px-1.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground">
                            {doctors.find((d) => d.id === id)?.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.active}
                        aria-label={`${s.active ? "Deactivate" : "Activate"} ${s.name}`}
                        onCheckedChange={(on) => {
                          serviceService.update(s.id, { active: on });
                          toast.success(`${s.name} ${on ? "activated" : "deactivated"}`);
                        }}
                      />
                    </TableCell>
                    <TableCell className="pr-5">
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
      <ServiceFormDialog open={editing !== null} service={editing && editing !== "new" ? editing : undefined} onOpenChange={(o) => !o && setEditing(null)} />
    </PageContainer>
  );
}

const serviceSchema = z.object({
  name: z.string().trim().min(3, "Enter a service name").max(60),
  description: z.string().trim().max(240),
  durationMinutes: z.coerce.number().int().min(10, "At least 10 minutes").max(180),
  price: z.union([z.literal(""), z.coerce.number().min(0)]).optional(),
  doctorIds: z.array(z.string()).min(1, "Assign at least one doctor"),
});
type ServiceForm = z.infer<typeof serviceSchema>;

function ServiceFormDialog({ open, onOpenChange, service }: { open: boolean; onOpenChange: (o: boolean) => void; service?: Service | undefined }) {
  const doctors = useClinic((s) => s.doctors);
  const { register, control, handleSubmit, reset, formState } = useForm<ServiceForm>({ resolver: zodResolver(serviceSchema) });
  useEffect(() => {
    if (open)
      reset(
        service
          ? { ...service, price: service.price ?? "" }
          : { name: "", description: "", durationMinutes: 30, price: "", doctorIds: [] },
      );
  }, [open, service, reset]);

  const onSubmit = (v: ServiceForm) => {
    const data = { ...v, price: v.price === "" || v.price === undefined ? undefined : Number(v.price) };
    if (service) {
      serviceService.update(service.id, data);
      toast.success("Service updated");
    } else {
      serviceService.create({ ...data, active: true });
      toast.success(`${v.name} added`);
    }
    onOpenChange(false);
  };
  const e = formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "Add service"}</DialogTitle>
          <DialogDescription>Patients see the name and description when booking on WhatsApp.</DialogDescription>
        </DialogHeader>
        <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Service name" error={e.name?.message} className="sm:col-span-2"><Input {...register("name")} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea rows={2} {...register("description")} /></Field>
          <Field label="Duration (minutes)" error={e.durationMinutes?.message}><Input type="number" {...register("durationMinutes")} /></Field>
          <Field label="Fee in ₹ (optional)"><Input type="number" {...register("price")} /></Field>
          <Field label="Assigned doctors" error={e.doctorIds?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="doctorIds"
              render={({ field }) => (
                <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                  {doctors.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value?.includes(d.id)}
                        onCheckedChange={(on) =>
                          field.onChange(on ? [...(field.value ?? []), d.id] : (field.value ?? []).filter((x) => x !== d.id))
                        }
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              )}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="service-form">{service ? "Save changes" : "Add service"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
