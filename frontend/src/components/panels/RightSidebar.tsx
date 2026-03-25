'use client'

import type { ReactNode } from 'react'
import { useStore } from '@/store/useStore'
import type { ProductMode } from '@/store/useStore'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import PolicyWatchPanel from './PolicyWatchPanel'

// Overview
import SAIntelFeedPanel from './SAIntelFeedPanel'
import ProtestMonitorPanel from './ProtestMonitorPanel'
import MostWantedPanel from './MostWantedPanel'
import MarketDataPanel from './MarketDataPanel'
import DamLevelsPanel from './DamLevelsPanel'
import SASSAPanel from './SASSAPanel'
import GoodNewsPanel from './GoodNewsPanel'
import BorderMigrationPanel from './BorderMigrationPanel'
import SocialPulsePanel from './SocialPulsePanel'

// Governance
import MunicipalPainIndexPanel from './MunicipalPainIndexPanel'
import GovernancePosturePanel from './GovernancePosturePanel'
import ServiceCascadePanel from './ServiceCascadePanel'

// Judiciary
import CourtJudgmentsPanel from './CourtJudgmentsPanel'
import StateCapturePanel from './StateCapturePanel'
import HawksArrestsPanel from './HawksArrestsPanel'

// Economy
import GlobalRelationsPanel from './GlobalRelationsPanel'
import EconomicStressPanel from './EconomicStressPanel'
import JSETrackerPanel from './JSETrackerPanel'

// Safety
import CrimeCategoriesPanel from './CrimeCategoriesPanel'
import AFUAssetsPanel from './AFUAssetsPanel'

// Environment
import DayZeroPanel from './DayZeroPanel'

// Always-visible
import LiveTVPanel from './LiveTVPanel'
import FocalMunicipalitiesPanel from './FocalMunicipalitiesPanel'

const PANEL_CONFIGS: Record<ProductMode, ReactNode[]> = {
  overview: [
    <LiveTVPanel key="tv" />,
    <SAIntelFeedPanel key="intel" />,
    <PolicyWatchPanel key="policy" />,
    <MarketDataPanel key="markets" />,
    <DamLevelsPanel key="dams" />,
    <SASSAPanel key="sassa" />,
  ],

  governance: [
    <LiveTVPanel key="tv" />,
    <MunicipalPainIndexPanel key="pain" />,
    <FocalMunicipalitiesPanel key="focal" />,
    <GovernancePosturePanel key="governance" />,
    <StateCapturePanel key="capture" />,
    <SASSAPanel key="sassa" />,
    <GoodNewsPanel key="good" />,
  ],

  economy: [
    <LiveTVPanel key="tv" />,
    <JSETrackerPanel key="jse" />,
    <EconomicStressPanel key="econ" />,
    <MarketDataPanel key="markets" />,
    <GlobalRelationsPanel key="global" />,
    <SAIntelFeedPanel key="intel" />,
    <GoodNewsPanel key="good" />,
  ],

  safety: [
    <LiveTVPanel key="tv" />,
    <CrimeCategoriesPanel key="crime" />,
    <MostWantedPanel key="wanted" />,
    <ProtestMonitorPanel key="protests" />,
    <BorderMigrationPanel key="border" />,
    <HawksArrestsPanel key="hawks" />,
    <AFUAssetsPanel key="afu" />,
  ],

  environment: [
    <LiveTVPanel key="tv" />,
    <DamLevelsPanel key="dams" />,
    <DayZeroPanel key="dayzero" />,
    <ServiceCascadePanel key="service" />,
    <GoodNewsPanel key="good" />,
    <SocialPulsePanel key="social" />,
    <SAIntelFeedPanel key="intel" />,
  ],

  judiciary: [
    <LiveTVPanel key="tv" />,
    <CourtJudgmentsPanel key="courts" />,
    <StateCapturePanel key="capture" />,
    <HawksArrestsPanel key="hawks" />,
    <AFUAssetsPanel key="afu" />,
    <MostWantedPanel key="wanted" />,
  ],
}

export default function RightSidebar() {
  const activeMode = useStore((s) => s.activeMode)
  const panels = PANEL_CONFIGS[activeMode] ?? PANEL_CONFIGS.overview

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#000',
      overflowY: 'auto',
      scrollbarWidth: 'none',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {panels.map((panel, i) => (
        <ErrorBoundary key={i} name={`RightPanel-${i}`}>
          {panel}
        </ErrorBoundary>
      ))}
    </div>
  )
}
