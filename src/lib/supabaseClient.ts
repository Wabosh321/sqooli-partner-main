import { supabase } from "./supabase";
import { upsertWithConvexId, findByConvexId } from "./supabaseHelpers";
import type {
  PartnerDoc,
  UserDoc,
  CampaignDoc,
  WalletDoc,
  TransactionDoc,
  PermissionDoc,
  ProgramDoc,
  CurriculumDoc,
  SubjectDoc,
} from "../types/supabase.types";

/*
  Supabase client helpers
  - Minimal, focused CRUD helpers for frontend usage
  - Use `upsertWithConvexId` to preserve legacy Convex IDs when migrating
  - Add more functions as needed
  Note: This file was added during Convex->Supabase migration.
*/

// Partners
export async function listPartners() {
  const { data, error } = await supabase.from<PartnerDoc>("partners").select("*");
  if (error) throw error;
  return data || [];
}

export async function getPartner(id: string) {
  const { data, error } = await supabase.from<PartnerDoc>("partners").select("*").eq("id", id).limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function createPartner(payload: Partial<PartnerDoc>) {
  const { data, error } = await supabase.from<PartnerDoc>("partners").insert(payload).select();
  if (error) throw error;
  return (data && data[0]) || null;
}

export async function upsertPartnerWithConvex(convexId: string, payload: Partial<PartnerDoc>) {
  return upsertWithConvexId("partners", convexId, payload);
}

// Users
export async function listUsers() {
  const { data, error } = await supabase.from<UserDoc>("users").select("*");
  if (error) throw error;
  return data || [];
}

export async function getUser(id: string) {
  const { data, error } = await supabase.from<UserDoc>("users").select("*").eq("id", id).limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function createUser(payload: Partial<UserDoc>) {
  const { data, error } = await supabase.from<UserDoc>("users").insert(payload).select();
  if (error) throw error;
  return (data && data[0]) || null;
}

export async function upsertUserWithConvex(convexId: string, payload: Partial<UserDoc>) {
  return upsertWithConvexId("users", convexId, payload);
}

// Campaigns
export async function listCampaigns() {
  const { data, error } = await supabase.from<CampaignDoc>("campaigns").select("*");
  if (error) throw error;
  return data || [];
}

export async function createCampaign(payload: Partial<CampaignDoc>) {
  const { data, error } = await supabase.from<CampaignDoc>("campaigns").insert(payload).select();
  if (error) throw error;
  return (data && data[0]) || null;
}

// Wallets
export async function getWalletByPartner(partnerId: string) {
  const { data, error } = await supabase.from<WalletDoc>("wallets").select("*").eq("partner_id", partnerId);
  if (error) throw error;
  return data || [];
}

// Transactions
export async function createTransaction(payload: Partial<TransactionDoc>) {
  const { data, error } = await supabase.from<TransactionDoc>("transactions").insert(payload).select();
  if (error) throw error;
  return (data && data[0]) || null;
}

// Programs/Curricula/Subjects - simple listing helpers
export async function listPrograms() {
  const { data, error } = await supabase.from("programs").select("*");
  if (error) throw error;
  return data || [];
}

export async function listChannels(partnerId: string) {
  const { data, error } = await supabase.from("channels").select("*").eq('partner_id', partnerId);
  if (error) throw error;
  return data || [];
}

export async function listSubjects() {
  const { data, error } = await supabase.from("subjects").select("*");
  if (error) throw error;
  return data || [];
}

export async function listCurricula() {
  const { data, error } = await supabase.from("curricula").select("*");
  if (error) throw error;
  return data || [];
}


export async function findRowByConvexId(table: string, convexId: string) {
  return findByConvexId(table, convexId);
}

export default {
  // partners
  listPartners,
  getPartner,
  createPartner,
  upsertPartnerWithConvex,
  // users
  listUsers,
  getUser,
  createUser,
  upsertUserWithConvex,
  // campaigns
  listCampaigns,
  createCampaign,
  // wallets
  getWalletByPartner,
  // transactions
  createTransaction,
  // programs
  listPrograms,
  listSubjects,
  listCurricula,
  listChannels,
  // utils
  findRowByConvexId,
};
