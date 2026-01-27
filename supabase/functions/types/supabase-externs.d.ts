declare module "https://esm.sh/@supabase/supabase-js@2.38.0" {
  export * from "@supabase/supabase-js";
}

// Fallback for other esm.sh imports
declare module "https://esm.sh/*" {
  const whatever: any;
  export default whatever;
}
