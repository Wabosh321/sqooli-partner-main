/**
 * Social Media Channels Display Component
 * Shows partner's social media accounts with engagement stats
 */

import { SocialMediaAccount } from '../../lib/socialMediaService';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ExternalLink, Users, TrendingUp } from 'lucide-react';

interface SocialMediaChannelsProps {
  accounts: (SocialMediaAccount & { channels?: any[] })[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  showStats?: boolean;
}

export function SocialMediaChannels({
  accounts,
  selectedId,
  onSelect,
  showStats = true,
}: SocialMediaChannelsProps) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No social media accounts connected.</p>
        <p className="text-xs mt-2">Admin can add them from partner settings.</p>
      </div>
    );
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'bg-pink-100 text-pink-800',
      tiktok: 'bg-black text-white',
      facebook: 'bg-blue-100 text-blue-800',
      twitter: 'bg-sky-100 text-sky-800',
      youtube: 'bg-red-100 text-red-800',
      linkedin: 'bg-blue-600 text-white',
      whatsapp: 'bg-green-100 text-green-800',
      telegram: 'bg-cyan-100 text-cyan-800',
    };
    return colors[platform.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📸',
      tiktok: '🎵',
      facebook: '👥',
      twitter: '🐦',
      youtube: '▶️',
      linkedin: '💼',
      whatsapp: '💬',
      telegram: '✈️',
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {accounts.map((account) => (
        <Card
          key={account.id}
          className={`cursor-pointer transition-all ${
            selectedId === account.id
              ? 'ring-2 ring-primary border-primary'
              : 'hover:border-primary/50'
          }`}
          onClick={() => onSelect?.(account.id)}
        >
          <CardContent className="pt-6">
            {/* Platform Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                <div>
                  <Badge className={`${getPlatformColor(account.platform)} capitalize`}>
                    {account.platform}
                  </Badge>
                  {account.is_verified && (
                    <Badge variant="outline" className="ml-2">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>
              <a
                href={account.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Handle */}
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">{account.handle}</p>
              <p className="text-xs text-muted-foreground">{account.url}</p>
            </div>

            {/* Stats */}
            {showStats && (
              <div className="space-y-2 pt-3 border-t border-border">
                {account.follower_count > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Followers
                    </span>
                    <span className="font-semibold">
                      {account.follower_count.toLocaleString()}
                    </span>
                  </div>
                )}
                {account.engagement_rate > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Engagement
                    </span>
                    <span className="font-semibold">{account.engagement_rate.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            <div className="mt-3">
              <Badge
                variant={account.status === 'active' ? 'default' : 'secondary'}
                className="text-xs capitalize"
              >
                {account.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default SocialMediaChannels;
