-- Phase 2: Add Foreign Key Constraints (runs after all tables created)
-- This migration adds FKs that depend on tables created later

-- Add campaigns.program_id -> programs.id FK constraint
ALTER TABLE public.campaigns
ADD CONSTRAINT fk_campaigns_program_id 
FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE SET NULL;

-- Add tasks.campaign_id -> campaigns.id FK (if not already present)
-- This is created in 007_phase2_tasks_table but listed here for documentation
