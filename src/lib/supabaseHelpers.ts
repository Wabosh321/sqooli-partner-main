import { supabase } from "./supabase";

type Maybe<T> = T | null;

export async function listTable<T = any>(table: string, select = "*") {
  const { data, error } = await supabase.from<T, T>(table).select(select);
  if (error) throw error;
  return data as Maybe<T[]>;
}

export async function getById<T = any>(table: string, id: string | number) {
  const { data, error } = await supabase.from<T, T>(table).select("*").eq("id", id).limit(1).maybeSingle();
  if (error) throw error;
  return data as Maybe<T>;
}

export async function insertRow<T = any>(table: string, payload: Partial<T>) {
  const { data, error } = await supabase.from<T, T>(table).insert([payload]).select().single();
  if (error) throw error;
  return data as Maybe<T>;
}

export async function updateRow<T = any>(table: string, id: string | number, payload: Partial<T>) {
  const { data, error } = await supabase.from<T, T>(table).update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as Maybe<T>;
}

export async function deleteRow(table: string, id: string | number) {
  const { data, error } = await supabase.from(table).delete().eq("id", id).select();
  if (error) throw error;
  return data;
}


export async function findByConvexId<T = any>(table: string, convexId: string) {
  const { data, error } = await supabase.from<T, T>(table).select("*").eq("legacy_convex_id", convexId).limit(1).maybeSingle();
  if (error) throw error;
  return data as Maybe<T>;
}

export async function upsertWithConvexId<T = any>(table: string, convexId: string, payload: Partial<T>) {
  
  const existing = await findByConvexId<T>(table, convexId);
  if (existing) {
    return updateRow<T>(table, (existing as any).id, payload);
  }
  const toInsert = { ...(payload as object), legacy_convex_id: convexId } as Partial<T>;
  return insertRow<T>(table, toInsert);
}

export default {
  listTable,
  getById,
  insertRow,
  updateRow,
  deleteRow,
  findByConvexId,
  upsertWithConvexId,
};
