import React from 'react';
import { BaseRecentActivity } from '../../../../../components/dashboard/activity/BaseRecentActivity';
import { Activity } from '../../../../../types/activity';

interface AdminActivityProps {
  activities: Activity[];
  currentUserName: string;
  onSeeMore?: () => void;
  tenantId: string; // ✅ TAMBAH: diteruskan ke BaseRecentActivity
}

export const AdminActivity: React.FC<AdminActivityProps> = ({
  activities,
  currentUserName,
  onSeeMore,
  tenantId,
}) => {
  return (
    <BaseRecentActivity
      activities={activities}
      currentUserName={currentUserName}
      userRole="admin"
      title="Aktivitas Terbaru"
      onSeeMore={onSeeMore}
      tenantId={tenantId} // ✅ Teruskan ke BaseRecentActivity
    />
  );
};