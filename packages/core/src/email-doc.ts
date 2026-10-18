import { z } from 'zod';

/**
 * The email document: an ordered list of typed blocks the builder edits
 * and the renderer (packages/emails) turns into HTML + plain text.
 * Deliberately small for Phase 1 — rich layout arrives with the
 * drag-and-drop builder.
 */

const textValue = z.string().max(5000);
const urlValue = z.string().trim().url().max(2048);

export const emailBlockSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('heading'),
    text: textValue,
    /** Optional segment ID required to display this block dynamically. */
    showIfSegmentId: z.string().min(1).max(64).optional(),
  }),
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('paragraph'),
    text: textValue,
    showIfSegmentId: z.string().min(1).max(64).optional(),
  }),
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('button'),
    label: z.string().trim().min(1).max(200),
    url: urlValue,
    showIfSegmentId: z.string().min(1).max(64).optional(),
  }),
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('image'),
    url: urlValue,
    alt: z.string().max(300).default(''),
    /** Display width as a percentage of the email body (default: natural
     *  size capped at 100%). */
    width: z.number().int().min(10).max(100).optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    /** Corner rounding in pixels. */
    radius: z.number().int().min(0).max(32).optional(),
    showIfSegmentId: z.string().min(1).max(64).optional(),
  }),
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('divider'),
    showIfSegmentId: z.string().min(1).max(64).optional(),
  }),
  z.object({
    id: z.string().min(1).max(64),
    type: z.literal('spacer'),
    showIfSegmentId: z.string().min(1).max(64).optional(),
  }),
]);
export type EmailBlock = z.infer<typeof emailBlockSchema>;

export const emailDocumentSchema = z.object({
  blocks: z.array(emailBlockSchema).min(1).max(100),
});
export type EmailDocument = z.infer<typeof emailDocumentSchema>;

/**
 * Personalization tokens: `{{firstName}}`, `{{lastName}}`, `{{email}}`,
 * `{{attributes.plan}}` — each with an optional fallback after a pipe:
 * `{{firstName|there}}`.
 */
const TOKEN_PATTERN = /\{\{\s*([a-zA-Z][a-zA-Z0-9_.]*)\s*(?:\|([^}]*))?\}\}/g;

export interface PersonalizationContact {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  attributes?: Record<string, unknown>;
}

export function renderTokens(template: string, contact: PersonalizationContact): string {
  return template.replace(TOKEN_PATTERN, (_match, rawPath: string, fallback?: string) => {
    const value = resolveToken(rawPath, contact);
    if (value !== undefined && value !== null && value !== '') return String(value);
    return fallback?.trim() ?? '';
  });
}

function resolveToken(path: string, contact: PersonalizationContact): unknown {
  if (path === 'email') return contact.email;
  if (path === 'firstName') return contact.firstName;
  if (path === 'lastName') return contact.lastName;
  if (path.startsWith('attributes.')) {
    return contact.attributes?.[path.slice('attributes.'.length)];
  }
  return undefined;
}

/** Tokens present in a document — lets the UI warn about unknown ones. */
export function evaluateBlockVisibility(
  block: EmailBlock,
  activeSegmentIds: string[] = [],
): boolean {
  if (!block.showIfSegmentId) return true;
  return activeSegmentIds.includes(block.showIfSegmentId);
}

export const collaborationSessionSchema = z.object({
  documentId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  activeBlockId: z.string().optional(),
  lastSeenAt: z.date(),
});
export type CollaborationSession = z.infer<typeof collaborationSessionSchema>;

export function extractTokens(text: string): string[] {
  const tokens = new Set<string>();
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    tokens.add(match[1]!);
  }
  return [...tokens];
}
