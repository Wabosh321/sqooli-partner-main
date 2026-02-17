import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Eye, Trash2, Lock } from "lucide-react";
import { Button } from "../../../components/ui/button";
import type { Campaign } from "../../../domain/campaign/types";
import { supabase } from "../../../lib/supabase";

export interface CampaignTableProps {
  campaigns: Campaign[];
  onView?: (id: string) => void;
  onDelete?: (campaign: Campaign) => void;
}

export function CampaignTable({
  campaigns,
  onView,
  onDelete,
}: CampaignTableProps) {
  const [programs, setPrograms] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from("programs")
          .select("id, name");

        if (error) throw error;

        // Create a map of program id -> name
        const programMap = (data || []).reduce(
          (acc: Record<string, string>, p: any) => {
            acc[p.id] = p.name;
            return acc;
          },
          {},
        );

        setPrograms(programMap);
      } catch (err) {
        console.error("Error loading programs:", err);
      }
    };

    loadPrograms();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  };

  const getProgramName = (programId?: string) => {
    if (!programId) return "N/A";
    return programs[programId] || "N/A";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs text-muted-foreground font-normal pl-6">
              Campaign Details
            </TableHead>
            <TableHead className="text-xs text-muted-foreground font-normal">
              Program
            </TableHead>
            <TableHead className="text-xs text-muted-foreground font-normal">
              Engagements
            </TableHead>
            <TableHead className="text-xs text-muted-foreground font-normal">
              Min. Lessons
            </TableHead>
            <TableHead className="text-xs text-muted-foreground font-normal">
              Expiry Date
            </TableHead>
            <TableHead className="text-xs text-muted-foreground font-normal pr-6">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow
              key={campaign._id}
              className="border-border hover:bg-muted/30"
            >
              <TableCell className="pl-6">
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">
                    {formatDate(campaign.duration_start)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    #{campaign.promo_code}
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {campaign.name}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">Program</div>
                  <div className="text-sm text-foreground">
                    {getProgramName(campaign.program_id)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">
                    Engagements
                  </div>
                  <div className="text-sm text-foreground">
                    {campaign.target_signups}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">
                    Min. Lessons
                  </div>
                  <div className="text-sm text-foreground">
                    {campaign.bundled_offers?.min_lessons}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">
                    Expiry Date
                  </div>
                  <div className="text-sm text-foreground">
                    {formatDate(campaign.duration_end)}
                  </div>
                </div>
              </TableCell>
              <TableCell className="pr-6">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => onView?.(campaign._id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete?.(campaign)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
