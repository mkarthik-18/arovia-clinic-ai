import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Bot, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/common/page";
import { useClinic } from "@/services/demo/store";

function StatusLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "off" | "on" | "muted";
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        {tone !== "muted" && (
          <span
            className={
              tone === "on"
                ? "size-1.5 rounded-full bg-success"
                : "size-1.5 rounded-full bg-neutral"
            }
          />
        )}
        {value}
      </span>
    </div>
  );
}

export function AssistantStatus() {
  const conversations = useClinic((s) => s.conversations);
  const last = conversations
    .flatMap((c) => c.messages.filter((m) => m.from === "patient"))
    .sort((a, b) => b.at.localeCompare(a.at))[0];

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-teal-soft text-teal-soft-foreground">
            <Bot className="size-3.5" />
          </span>
          Arovia Assistant
        </span>
      }
      description="Planned AI receptionist for WhatsApp"
      bodyClassName="py-2"
    >
      <div className="divide-y">
        <StatusLine label="WhatsApp connection" value="Not connected" tone="off" />
        <StatusLine label="AI agent" value="Not connected" tone="off" />
        <StatusLine
          label="Last message (demo)"
          value={last ? formatDistanceToNow(new Date(last.at), { addSuffix: true }) : "—"}
          tone="muted"
        />
        <StatusLine
          label="Handled today (demo)"
          value={String(conversations.length)}
          tone="muted"
        />
      </div>
      <div className="mt-2 mb-2 flex gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link to="/conversations">
            <MessageCircle className="size-3.5" /> View chats
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1">
          <Link to="/settings" search={{ tab: "whatsapp" }}>
            Connect
          </Link>
        </Button>
      </div>
    </Panel>
  );
}
