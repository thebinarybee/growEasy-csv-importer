import { z } from "zod";

export const CrmStatusEnum = z.enum([
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
  "",
]);

export const DataSourceEnum = z.enum([
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
  "",
]);

export const CrmRecordSchema = z.object({
  name: z.string(),
  email: z.string(),
  country_code: z.string(),
  mobile_without_country_code: z.string(),
  company: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  lead_owner: z.string(),
  crm_status: CrmStatusEnum,
  crm_note: z.string(),
  data_source: DataSourceEnum,
  possession_time: z.string(),
  description: z.string(),
  created_at: z.string(),
});

export const CrmRecordsResponseSchema = z.object({
  records: z.array(CrmRecordSchema),
  skipped: z.array(
    z.object({
      row: z.record(z.string(), z.string()),
      reason: z.string(),
    })
  ),
});

export type CrmRecord = z.infer<typeof CrmRecordSchema>;