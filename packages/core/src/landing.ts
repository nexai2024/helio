import { z } from 'zod';

/**
 * The block types a landing page is built from. Kept small and web-native
 * (unlike the table-based email blocks); the public page renders these as
 * plain React.
 */
export const landingBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('heading'), text: z.string().trim().min(1).max(200) }),
  z.object({ type: z.literal('text'), text: z.string().trim().min(1).max(2000) }),
  z.object({
    type: z.literal('image'),
    url: z.string().trim().url().max(2000),
    alt: z.string().trim().max(200).default(''),
  }),
  z.object({
    type: z.literal('button'),
    label: z.string().trim().min(1).max(80),
    href: z.string().trim().url().max(2000),
  }),
  z.object({
    type: z.literal('form'),
    /** Capture an email; the submit button's label. */
    buttonLabel: z.string().trim().min(1).max(80).default('Sign up'),
  }),
]);

export type LandingBlock = z.infer<typeof landingBlockSchema>;
export type LandingBlockType = LandingBlock['type'];

/** The ordered blocks of a landing page. */
export const landingDocumentSchema = z.array(landingBlockSchema).max(50);
export type LandingDocument = z.infer<typeof landingDocumentSchema>;

/** The block types available in the builder palette. */
export const LANDING_BLOCK_TYPES = ['heading', 'text', 'image', 'button', 'form'] as const;

/** A sensible empty block of the given type for the builder to insert. */
export const formFieldSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(['text', 'email', 'phone', 'select', 'checkbox']),
  label: z.string().trim().min(1).max(100),
  placeholder: z.string().trim().max(100).optional(),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(100)).optional(),
});
export type FormField = z.infer<typeof formFieldSchema>;

export const formDocumentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  submitLabel: z.string().trim().min(1).max(80).default('Submit'),
  fields: z.array(formFieldSchema).min(1).max(30),
});
export type FormDocument = z.infer<typeof formDocumentSchema>;

export function emptyLandingBlock(type: LandingBlockType): LandingBlock {
  switch (type) {
    case 'heading':
      return { type, text: 'Headline' };
    case 'text':
      return { type, text: 'Tell your story here.' };
    case 'image':
      return { type, url: 'https://', alt: '' };
    case 'button':
      return { type, label: 'Get started', href: 'https://' };
    case 'form':
      return { type, buttonLabel: 'Sign up' };
  }
}
