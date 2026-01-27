import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Lock, AlertCircle } from "lucide-react";
import {
  DASHBOARD_SECTION_CONFIG,
  getResponsivePadding,
  getSectionContainerStyle,
} from "./SettingsSection";
import { useDeviceSize } from "../hooks/useDeviceSize";

export default function LockedSection({
  sectionName,
}: {
  sectionName: string;
}) {
  const { isMobile, isTablet } = useDeviceSize();
  const padding = getResponsivePadding(isMobile, isTablet);

  return (
    <div style={getSectionContainerStyle(padding)}>
      <div
        className="mx-auto flex items-center justify-center min-h-[60vh]"
        style={{
          width: "max(88.33vw, 1272px)",
          maxWidth: "100%",
        }}
      >
        <Card className="max-w-md w-full border-destructive/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg">Access Restricted</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                You don't have permission to access{" "}
                <span className="font-medium text-foreground">
                  {sectionName}
                </span>
                .
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
