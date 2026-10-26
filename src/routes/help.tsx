import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Mail, MessageCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Panel } from "@/components/common/page";
import { resetDemoData } from "@/services/demo/store";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support — Arovia Healthcare Dashboard" },
      {
        name: "description",
        content: "Answers to common questions about running Arovia Clinic AI.",
      },
      { property: "og:title", content: "Help & Support — Arovia Healthcare Dashboard" },
      {
        property: "og:description",
        content: "Answers to common questions about running Arovia Clinic AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

const FAQ = [
  [
    "How does Arovia Assistant book appointments?",
    "Once connected, Arovia Assistant will be able to ask WhatsApp patients for their name, age and reason for visit, offer free slots from the Availability page, and book the one they choose. WhatsApp is not connected in this demo.",
  ],
  [
    "Which slots can patients book?",
    "Only slots inside the clinic's weekly schedule and the doctor's own working days and hours, excluding blocked dates and slots that are already taken.",
  ],
  [
    "Can two patients book the same slot?",
    "No. A doctor's slot is held once it's confirmed or pending, up to the 'maximum bookings per slot' you set.",
  ],
  [
    "What does the 'Demo data' label mean?",
    "Everything you see right now is realistic sample data. Changes last until you reload the page. Real records appear once the clinic's secure backend is connected.",
  ],
  [
    "Can I reply to patients from the dashboard?",
    "The Conversations page is a viewer for now. Manual replies become available once WhatsApp is connected.",
  ],
];

function HelpPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Help & Support"
        subtitle="Answers to common questions about Arovia Clinic AI."
        demo={false}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title="Frequently asked questions" bodyClassName="px-5 py-1">
          <Accordion type="single" collapsible>
            {FAQ.map(([q, a], i) => (
              <AccordionItem key={i} value={String(i)}>
                <AccordionTrigger className="text-sm">{q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Panel>
        <div className="space-y-4">
          <Panel title="Contact support">
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="mailto:support@aroviaclinic.in">
                  <Mail className="size-4" /> support@aroviaclinic.in
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/conversations">
                  <MessageCircle className="size-4" /> Review conversations
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/availability">
                  <BookOpen className="size-4" /> Set up availability
                </Link>
              </Button>
            </div>
          </Panel>
          <Panel title="Demo workspace">
            <p className="text-sm text-muted-foreground">
              Restore the original sample appointments, patients and settings.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                resetDemoData();
                toast.success("Sample data restored");
              }}
            >
              <RotateCcw className="size-3.5" /> Reset demo data
            </Button>
          </Panel>
        </div>
      </div>
    </PageContainer>
  );
}
