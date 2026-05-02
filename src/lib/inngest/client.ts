import 'server-only';
import { Inngest, eventType } from 'inngest';
import { z } from 'zod';
import type { ImportEntity } from '@/lib/imports/entities/types';

export type { ImportEntity };

const importEntity = z.enum([
  'clients',
  'productCategories',
  'manufacturers',
  'suppliers',
  'serviceCategories',
  'operators',
  'products',
  'services',
]);

const columnMappingSchema = z.object({
  sourceColumn: z.string(),
  destField: z.string().nullable(),
  confidence: z.number(),
});

/**
 * Typed event definitions. Each `eventType()` doubles as the trigger declaration
 * for `createFunction` AND a payload schema. This is how Inngest v4 wires up
 * end-to-end type safety from `inngest.send()` through to handler `event.data`.
 */
export const importProcessRequested = eventType('import/process.requested', {
  schema: z.object({
    jobId: z.string(),
    salonId: z.string(),
    entity: importEntity,
  }),
});

export const importCommitRequested = eventType('import/commit.requested', {
  schema: z.object({
    jobId: z.string(),
    salonId: z.string(),
    entity: importEntity,
    mappings: z.array(columnMappingSchema),
  }),
});

export const inngest = new Inngest({ id: 'lume' });
