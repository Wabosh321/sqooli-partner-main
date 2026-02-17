import BadgeSvg from "../../../assets/Badge.svg";
import BeneficiaryBadgeSvg from "../../../assets/beneficiary_badge.svg";
import type { PartnerBadgeProps } from "./types";

/**
 * PartnerBadge component
 *
 * Renders the appropriate partner badge based on partner_type:
 * - "media" → Media badge
 * - "beneficiary" → Beneficiary badge
 * - null/undefined/unknown → renders nothing (fail-safe)
 */
export function PartnerBadge({ partnerType }: PartnerBadgeProps) {
  if (!partnerType) {
    return null;
  }

  switch (partnerType) {
    case "media":
      return (
        <img
          src={BadgeSvg}
          alt="Media Badge"
          style={{ width: "143px", height: "22px" }}
          className="cursor-pointer"
        />
      );
    case "beneficiary":
      return (
        <img
          src={BeneficiaryBadgeSvg}
          alt="Beneficiary Badge"
          style={{ width: "143px", height: "22px" }}
          className="cursor-pointer"
        />
      );
    default:
      return null;
  }
}
