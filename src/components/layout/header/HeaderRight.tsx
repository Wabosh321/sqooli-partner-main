import { ChevronDown } from "lucide-react";
import { useDeviceSize } from "../../../hooks/useDeviceSize";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { NotificationDropdown } from "../../common/NotificationDropDown";
import type { HeaderRightProps } from "./types";

export function HeaderRight({
  partnerId,
  fullName,
  email,
  initials,
  userRole,
  userExtension,
  onLogout,
}: HeaderRightProps) {
  const { isMobile, isTablet } = useDeviceSize();

  const avatarUrl = "";

  return (
    <div className="flex items-center gap-2 lg:gap-4">
      {/* Notification Dropdown */}
      <NotificationDropdown partnerId={partnerId} />

      {/* Avatar Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`gap-2 ${isMobile ? "px-1" : "px-2"} hover:bg-transparent`}
          >
            <Avatar
              className={`${isMobile ? "h-7 w-7" : isTablet ? "h-8 w-8" : "h-8 w-8"}`}
            >
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary border border-border text-xs text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isMobile && (
              <div className="hidden lg:flex flex-col items-start max-w-[150px]">
                <span className="text-sm font-medium text-foreground truncate w-full">
                  {fullName}
                </span>
                {email && (
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {email}
                  </span>
                )}
                {userRole && (
                  <span className="text-xs text-muted-foreground truncate w-full capitalize">
                    {userRole.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            )}
            <ChevronDown
              className={`text-foreground ${isMobile ? "h-3 w-3" : "h-4 w-4"}`}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className={`${isMobile ? "w-48" : "w-56"}`}
        >
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>

          {partnerId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organization: {partnerId}
              </DropdownMenuLabel>
            </>
          )}

          {userExtension && (
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Extension: {userExtension}
            </DropdownMenuLabel>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={onLogout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
