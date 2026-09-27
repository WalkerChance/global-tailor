import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * AI photo → fabric attributes.
 *
 * A tailor uploads a swatch photo; Claude vision proposes catalog attributes
 * (name, composition, color, pattern, plus richer notes). The human always
 * confirms/edits before saving — the model proposes, it never decides.
 *
 * The whole feature is gated behind ANTHROPIC_API_KEY: with no key the app
 * behaves exactly as before (manual entry), so this is safe to ship without
 * provisioning a credential. Model is overridable via ANTHROPIC_MODEL; the
 * default is a fast, low-cost model appropriate for this narrow vision task.
 */

export type FabricAttributes = {
  name?: string;
  composition?: string;
  color?: string;
  pattern?: string;
  weave?: string;
  notes?: string;
};

export function isFabricAiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const TOOL_NAME = "record_fabric_attributes";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const SUPPORTED_MIME = new Set<MediaType>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function coerceMediaType(mime: string): MediaType {
  return SUPPORTED_MIME.has(mime as MediaType) ? (mime as MediaType) : "image/jpeg";
}

export async function analyzeFabricImage(input: {
  data: string; // base64-encoded image bytes
  mimeType: string;
}): Promise<FabricAttributes> {
  if (!isFabricAiEnabled()) {
    throw new Error("AI suggestions aren’t configured on this deployment.");
  }

  // Reads ANTHROPIC_API_KEY from the environment; never expose it to the client.
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Record the observable attributes of the fabric/textile shown in the photo, for a bespoke tailoring catalog.",
        input_schema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "Short catalog name, e.g. 'Navy wool herringbone'. Omit if unclear.",
            },
            composition: {
              type: "string",
              description:
                "Best-guess fiber composition, e.g. '100% wool' or 'wool blend'. Omit if not inferable from the image.",
            },
            color: {
              type: "string",
              description: "Primary color, e.g. 'Charcoal', 'Navy', 'Ecru'.",
            },
            pattern: {
              type: "string",
              description:
                "Pattern, e.g. 'Solid', 'Herringbone', 'Pinstripe', 'Windowpane', 'Glen check'.",
            },
            weave: {
              type: "string",
              description:
                "Weave or finish if visible, e.g. 'Twill', 'Plain', 'Flannel', 'Sateen'.",
            },
            notes: {
              type: "string",
              description:
                "One short sentence a customer would find useful about look/feel. Optional.",
            },
          },
          required: [],
        },
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: coerceMediaType(input.mimeType),
              data: input.data,
            },
          },
          {
            type: "text",
            text: "Identify this fabric's attributes for a tailoring catalog. Only report what you can actually observe in the image; leave a field out rather than guessing.",
          },
        ],
      },
    ],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("The model returned no attributes.");
  }

  const raw = (block.input ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;

  return {
    name: str(raw.name),
    composition: str(raw.composition),
    color: str(raw.color),
    pattern: str(raw.pattern),
    weave: str(raw.weave),
    notes: str(raw.notes),
  };
}
