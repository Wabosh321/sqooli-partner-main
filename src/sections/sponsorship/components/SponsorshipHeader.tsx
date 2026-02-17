import { Title } from "../../../components/ui/Typography";

interface SponsorshipHeaderProps {
  onAwardClick: () => void;
}

export function SponsorshipHeader({ onAwardClick }: SponsorshipHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <Title>Sponsorships</Title>
        <p className="text-sm text-gray-500 mt-1">
          Manage lesson bundles awarded to students
        </p>
      </div>
    </div>
  );
}
