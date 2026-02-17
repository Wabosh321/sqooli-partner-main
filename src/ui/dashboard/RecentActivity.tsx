import React, { useEffect, useState } from "react";
import { DashboardColors } from "../../theme/dashboardTheme";
import { supabase } from "../../lib/supabase";

export default function RecentActivity() {
  const [items, setItems] = useState<{ id: string; user: string; action: string; time: string }[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: logs, error } = await supabase
          .from('audit_logs')
          .select('id, user_id, action, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('RecentActivity: error fetching audit logs', error);
          if (mounted) setItems([]);
          return;
        }

        const logsArr = (logs || []) as any[];
        const userIds = Array.from(new Set(logsArr.map(l => l.user_id).filter(Boolean)));

        let usersMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', userIds);

          (users || []).forEach((u: any) => { usersMap[u.id] = u.full_name || u.email || 'User'; });
        }

        if (mounted) {
          setItems(
            logsArr.map(l => ({
              id: l.id,
              user: usersMap[l.user_id] || 'System',
              action: l.action || '',
              time: l.created_at ? new Date(l.created_at).toLocaleString() : '',
            }))
          );
        }
      } catch (err) {
        console.error(err);
        if (mounted) setItems([]);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <div 
      className="w-full h-full flex-1"
      style={{
        background: DashboardColors.section_background,
        border: `1px solid ${DashboardColors.border_muted}`,
        borderRadius: '12px',
        padding: 'max(1.1vw, 12px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div className="flex items-center justify-between mb-2" style={{ flex: '0 0 auto' }}>
        <p className="text-xs font-medium" style={{ color: DashboardColors.text_secondary }}>Recent Activity</p>
        <a href="#" className="text-xs font-medium" style={{ color: DashboardColors.primary }}>View All</a>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((it) => (
          <div key={it.id} className="flex items-start gap-2 pb-2 border-b last:border-0 text-xs" style={{ borderColor: DashboardColors.border_muted, flex: '0 0 auto' }}>
            <div 
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-xs text-white"
              style={{ background: DashboardColors.primary }}
            >
              {it.user.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-tight" style={{ color: DashboardColors.text_secondary }}>
                <span style={{ color: DashboardColors.primary }} className="font-semibold">{it.user}</span> {it.action}
              </p>
              <p className="text-xs mt-0.5 leading-tight" style={{ color: DashboardColors.text_muted }}>{it.time}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-gray-500">No recent activity.</div>}
      </div>
    </div>
  );
}
