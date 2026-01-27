import React from "react";
import { Search, Plus, Menu } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export interface CampaignHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCreate?: () => void;
  onMenu?: () => void;
}

export function CampaignHeader({ searchQuery, onSearchChange, onCreate, onMenu }: CampaignHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 mr-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            className="pl-10 bg-background border-border"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
        <Button variant="ghost" size="icon" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
