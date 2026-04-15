/**
 * useMemberSettings.ts
 * Hook untuk baca MemberSettings + active tiers dari Firestore.
 * Di-cache selama session — tidak re-fetch tiap render.
 */
import { useState, useEffect } from 'react';
import { SettingsService, DEFAULT_MEMBER_SETTINGS } from '@services/settingsService';
import { MemberSettings } from '@/types/settings.types';
import { MemberConfigService } from '@services/memberService';
import { MemberTier, DEFAULT_TIERS } from '@/types/member.types';

interface UseMemberSettingsResult {
  settings:  MemberSettings;
  tiers:     MemberTier[];
  loading:   boolean;
}

// DEFAULT_MEMBER_SETTINGS sudah include semua conditional fields
// (conditionalLogic, minVisits, minTotalSpend, conditionalFee)
export const useMemberSettings = (tenantId: string | null): UseMemberSettingsResult => {
  const [settings, setSettings] = useState<MemberSettings>(DEFAULT_MEMBER_SETTINGS);
  const [tiers,    setTiers]    = useState<MemberTier[]>(DEFAULT_TIERS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [s, t] = await Promise.all([
          SettingsService.getMemberSettings(tenantId),
          MemberConfigService.getActiveTiers(tenantId),
        ]);
        if (!cancelled) { setSettings(s); setTiers(t); }
      } catch (e) {
        console.error('useMemberSettings error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tenantId]);

  return { settings, tiers, loading };
};