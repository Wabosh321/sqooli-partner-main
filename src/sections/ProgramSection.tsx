// app/programs/section.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { usePartnerAccess } from "../hooks/usePartnerAccess";
import { Search, SlidersHorizontal, Plus, BookOpen, GraduationCap, Settings, MoreHorizontal, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { Loading } from "../components/common/Loading";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermission";
import { isConvexUser } from "../types/auth.types";
import CreateProgramDialog from "../components/common/CreateProgramDialog";
import CreateCurriculumDialog from "../components/common/CreateCurriculumDialog";
import ManageCurriculaDialog from "../components/common/ManageCurriculaDialog";
import CreateSubjectDialog from "../components/common/CreateSubjectDialog";
import ManageSubjectsDialog from "../components/common/ManageSubjectsDialog";
import EditProgramDialog from "../components/common/EditProgramDialog";
import { DASHBOARD_SECTION_CONFIG, getResponsivePadding, getSectionContainerStyle } from "./SettingsSection";
import { useDeviceSize } from "../hooks/useDeviceSize";

type Doc = {
  _id: string;
  name: string;
  end_date: string;
  [key: string]: any;
};

import { toast } from "sonner";
type Program = Doc;

function ProgramRow({ program, onEdit }: { program: Program; onEdit: (program: Program) => void; }) {
  const [campaigns, setCampaigns] = useState<any[] | undefined>(undefined);
  const [purchasesCount, setPurchasesCount] = useState<number | undefined>(undefined);
  const { userRole } = usePermissions();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: cdata } = await supabase
          .from("campaigns")
          .select("id")
          .eq("program_id", program._id);
        if (mounted) setCampaigns((cdata as any[]) || []);

        const { count } = await supabase
          .from("purchases")
          .select("id", { count: "exact", head: true })
          .eq("program_id", program._id);
        if (mounted) setPurchasesCount(count || 0);
      } catch (e) {
        console.error(e);
        if (mounted) {
          setCampaigns([]);
          setPurchasesCount(0);
        }
      }
    })();
    return () => { mounted = false; };
  }, [program._id]);


  const isSuperAdmin = userRole === 'super_admin';
  const handleDelete = async () => {
    try {
      toast.promise(
        (async () => {
          const { error } = await supabase.from("programs").delete().eq("id", program._id);
          if (error) throw error;
        })(),
        {
          loading: "Deleting program...",
          success: "Program deleted successfully!",
          error: "Failed to delete program.",
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <TableRow className="border-b border-muted/30 last:border-0">
      <TableCell className="py-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Program</p>
          <p className="text-sm font-medium text-foreground">
            {program.name}
          </p>
        </div>
      </TableCell>
      <TableCell className="py-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Campaigns</p>
          <p className="text-sm font-medium text-foreground">
            {campaigns?.length || 0}
          </p>
        </div>
      </TableCell>
      <TableCell className="py-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Engagements</p>
          <p className="text-sm font-medium text-foreground">
            {purchasesCount}
          </p>
        </div>
      </TableCell>
      <TableCell className="py-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Purchases</p>
          <p className="text-sm font-medium text-foreground">
            {purchasesCount}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={!isSuperAdmin} onClick={() => onEdit(program)}>
              <Edit className="h-4 w-4 mr-2" />
              {isSuperAdmin ? 'Edit' : 'Not Allowed'}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!isSuperAdmin} onClick={handleDelete} className="text-red-500">
              {isSuperAdmin ? "Delete" : "Not Allowed"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function ProgramsSection() {
  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateProgramDialog, setShowCreateProgramDialog] = useState(false);
  const [showCreateCurriculumDialog, setShowCreateCurriculumDialog] = useState(false);
  const [showManageCurriculaDialog, setShowManageCurriculaDialog] = useState(false);
  const [showCreateSubjectDialog, setShowCreateSubjectDialog] = useState(false);
  const [showManageSubjectsDialog, setShowManageSubjectsDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const itemsPerPage = 8;

  const { user } = useAuth();
  const { canWrite, hasPermission } = usePermissions();
  const [programs, setPrograms] = useState<Program[] | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from("programs").select("*");
        if (mounted) setPrograms(error ? [] : (data as Program[]) || []);
      } catch (err) {
        console.error(err);
        if (mounted) setPrograms([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isSuperAdmin = isConvexUser(user) && user.role === 'super_admin';
  const canCreatePrograms = isSuperAdmin || canWrite('programs') || hasPermission('programs.admin');

  const filteredPrograms = programs?.filter((program) => {
    const matchesSearch = program.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    const isActive = new Date(program.end_date) >= new Date();
    const matchesTab = activeTab === "active" ? isActive : !isActive;

    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil((filteredPrograms?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrograms = filteredPrograms?.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (programs === undefined) {
    return <Loading message="Loading programs..." size="lg" />;
  }

  return (
    <div style={getSectionContainerStyle(padding)}>
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Programs</h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {isSuperAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Curricula</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowCreateCurriculumDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Curriculum
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowManageCurriculaDialog(true)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Curricula
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Subjects</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowCreateSubjectDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Subject
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowManageSubjectsDialog(true)}>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Manage Subjects
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canCreatePrograms && (
            <Button
              onClick={() => setShowCreateProgramDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Program
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("active");
            setCurrentPage(1);
          }}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
            activeTab === "active"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active
          {activeTab === "active" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("inactive");
            setCurrentPage(1);
          }}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
            activeTab === "inactive"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inactive
          {activeTab === "inactive" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Table */}
      <div className="border border-muted rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="border-b border-muted/50">
              <TableHead>Program</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead>Engagements</TableHead>
              <TableHead>Purchases</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPrograms && paginatedPrograms.length > 0 ? (
              paginatedPrograms.map((program) => (
                <ProgramRow key={program._id} program={program} onEdit={setEditingProgram} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No programs found
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Program Dialog */}
      {canCreatePrograms && (
        <CreateProgramDialog
          open={showCreateProgramDialog}
          onOpenChange={setShowCreateProgramDialog}
        />
      )}

      {/* Edit Program Dialog */}
      {editingProgram && (
        <EditProgramDialog
          open={!!editingProgram}
          onOpenChange={() => setEditingProgram(null)}
          program={editingProgram}
        />
      )}

      {/* Curriculum Dialogs (Super Admin only) */}
      {isSuperAdmin && (
        <>
          <CreateCurriculumDialog
            open={showCreateCurriculumDialog}
            onOpenChange={setShowCreateCurriculumDialog}
          />
          <ManageCurriculaDialog
            open={showManageCurriculaDialog}
            onOpenChange={setShowManageCurriculaDialog}
          />
        </>
      )}

      {/* Subject Dialogs (Super Admin only) */}
      {isSuperAdmin && (
        <>
          <CreateSubjectDialog
            open={showCreateSubjectDialog}
            onOpenChange={setShowCreateSubjectDialog}
          />
          <ManageSubjectsDialog
            open={showManageSubjectsDialog}
            onOpenChange={setShowManageSubjectsDialog}
          />
        </>
      )}
      </div>
    </div>
  );
}
