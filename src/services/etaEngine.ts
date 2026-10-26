import { BusRoute, BusStop, CommunityReport, ETAResult, ScheduledDeparture } from '../types/transit';

/**
 * Smart Arrival Estimation Engine
 * Integrates baseline timetable schedules with crowd-sourced community reports,
 * time decay weighting, and stop-to-stop topology.
 */
export function calculateStopETA(
  route: BusRoute,
  targetStopId: string,
  allStops: BusStop[],
  schedules: ScheduledDeparture[],
  reports: CommunityReport[],
  referenceTimeMs: number = Date.now()
): ETAResult {
  const targetStopSchedule = route.stops.find((s) => s.stopId === targetStopId);
  const targetStopMeta = allStops.find((s) => s.id === targetStopId);
  const stopName = targetStopMeta ? targetStopMeta.name : 'Unknown Stop';

  const defaultAssumptions: string[] = [
    'Transparency Notice: This estimate is algorithmic and community-derived; not satellite GPS.',
  ];

  if (!targetStopSchedule) {
    return {
      routeId: route.id,
      stopId: targetStopId,
      stopName,
      scheduledTime: '--:--',
      estimatedArrivalMin: 0,
      estimatedArrivalTimeFormatted: 'Not on route',
      confidenceScore: 0,
      confidenceLevel: 'Limited Information',
      status: 'Scheduled Only',
      delayMinutes: 0,
      supportingReportsCount: 0,
      assumptions: ['Selected stop is not served by this specific route.'],
    };
  }

  // 1. Find the next scheduled arrival based on route departure timetable
  const routeSchedules = schedules.filter((s) => s.routeId === route.id);
  const refDate = new Date(referenceTimeMs);
  const currentMinutesFromMidnight = refDate.getHours() * 60 + refDate.getMinutes();

  // Find nearest scheduled run
  let closestScheduledArrivalMin = Infinity;
  let scheduledTimeStr = '08:30';

  if (routeSchedules.length > 0) {
    // Map schedules to arrival minutes at this stop
    const stopArrivalTimes = routeSchedules
      .map((sch) => {
        const [hh, mm] = sch.departureTime.split(':').map(Number);
        const depMin = hh * 60 + mm;
        const arrMin = depMin + targetStopSchedule.scheduledMinutesFromOrigin;
        return {
          departureTime: sch.departureTime,
          arrMin,
          timeFormatted: `${String(Math.floor(arrMin / 60) % 24).padStart(2, '0')}:${String(arrMin % 60).padStart(2, '0')}`,
        };
      })
      .sort((a, b) => a.arrMin - b.arrMin);

    const upcoming = stopArrivalTimes.find((t) => t.arrMin >= currentMinutesFromMidnight - 5);
    if (upcoming) {
      closestScheduledArrivalMin = upcoming.arrMin;
      scheduledTimeStr = upcoming.timeFormatted;
    } else if (stopArrivalTimes.length > 0) {
      // Loop over to first tomorrow departure or last run
      closestScheduledArrivalMin = stopArrivalTimes[0].arrMin + 24 * 60;
      scheduledTimeStr = `${stopArrivalTimes[0].timeFormatted} (Tomorrow)`;
    }
  } else {
    // Fallback based on headway frequency
    const approxArrival = (currentMinutesFromMidnight + (route.frequencyMinutes || 20));
    scheduledTimeStr = `${String(Math.floor(approxArrival / 60) % 24).padStart(2, '0')}:${String(approxArrival % 60).padStart(2, '0')}`;
  }

  // 2. Filter recent community reports for this route within 60 minutes
  const activeReports = reports
    .filter((r) => r.routeId === route.id && !r.isFlagged)
    .filter((r) => referenceTimeMs - r.timestamp < 60 * 60 * 1000)
    .sort((a, b) => b.timestamp - a.timestamp); // newest first

  // Check if any report is directly at or upstream of the target stop
  let bestReport: CommunityReport | null = null;
  let bestReportStopSchedule: (typeof route.stops)[0] | null = null;

  for (const report of activeReports) {
    const repStopSched = route.stops.find((s) => s.stopId === report.stopId);
    if (repStopSched && repStopSched.order <= targetStopSchedule.order) {
      bestReport = report;
      bestReportStopSchedule = repStopSched;
      break;
    }
  }

  // 3. Estimate ETA based on reports vs baseline
  let estimatedArrivalInMin = 15;
  let delayMinutes = 0;
  let confidenceScore = 32; // Baseline confidence without reports
  let status: ETAResult['status'] = 'Scheduled Only';
  const assumptions: string[] = [...defaultAssumptions];

  if (bestReport && bestReportStopSchedule) {
    const reportAgeMin = Math.max(0, Math.round((referenceTimeMs - bestReport.timestamp) / 60000));
    const isAtTargetStop = bestReport.stopId === targetStopId;

    // Travel time difference between reporter's stop and target stop
    const travelTimeDiffMin =
      targetStopSchedule.scheduledMinutesFromOrigin - bestReportStopSchedule.scheduledMinutesFromOrigin;

    delayMinutes = bestReport.delayMinutes || 0;

    if (bestReport.reportType === 'delayed') {
      status = 'Delayed';
      assumptions.push(
        `Community passenger reported ${delayMinutes} min delay at ${getStopName(bestReport.stopId, allStops)} (${reportAgeMin}m ago).`
      );
      if (bestReport.delayReason) {
        assumptions.push(`Delay Cause: "${bestReport.delayReason}".`);
      }
    } else if (bestReport.reportType === 'arrived') {
      if (isAtTargetStop && reportAgeMin <= 5) {
        status = 'Approaching';
        assumptions.push(`Passenger verified bus arrived at this stop ${reportAgeMin}m ago.`);
      } else {
        status = 'On Time';
        assumptions.push(
          `Passenger spotted bus arrived at upstream stop ${getStopName(bestReport.stopId, allStops)} ${reportAgeMin}m ago.`
        );
      }
    } else if (bestReport.reportType === 'departed') {
      if (isAtTargetStop) {
        status = 'Departed';
        assumptions.push(`Bus reported departed from this stop ${reportAgeMin}m ago.`);
      } else {
        status = 'Approaching';
        assumptions.push(
          `Bus departed upstream stop ${getStopName(bestReport.stopId, allStops)} ${reportAgeMin}m ago.`
        );
      }
    }

    // Time from now = (scheduled travel diff) - (elapsed time since report) + delay
    const projectedMin = travelTimeDiffMin - reportAgeMin + delayMinutes;
    estimatedArrivalInMin = Math.max(1, projectedMin);

    // Confidence Calculation:
    // Base 40 + Freshness bonus (up to +35) + Confirmations (+5 each, up to +20)
    let freshnessBonus = 0;
    if (reportAgeMin <= 5) freshnessBonus = 35;
    else if (reportAgeMin <= 15) freshnessBonus = 25;
    else if (reportAgeMin <= 30) freshnessBonus = 15;
    else freshnessBonus = 5;

    const confirmationBonus = Math.min(20, (bestReport.confirmationsCount || 0) * 5);
    const reliabilityBonus = Math.round((bestReport.reliabilityScore - 50) * 0.2);

    confidenceScore = Math.min(96, Math.max(25, 40 + freshnessBonus + confirmationBonus + reliabilityBonus));

    assumptions.push(
      `Weighted with ${bestReport.confirmationsCount} community verification(s) and freshness factor of ${reportAgeMin}m.`
    );
  } else {
    // Pure schedule calculation
    const minutesToScheduled = closestScheduledArrivalMin !== Infinity
      ? Math.max(2, closestScheduledArrivalMin - currentMinutesFromMidnight)
      : 18;

    estimatedArrivalInMin = minutesToScheduled;
    status = 'Scheduled Only';
    confidenceScore = 35;
    assumptions.push('No passenger reports in the past 60 minutes; arrival is derived purely from standard route timetable.');
  }

  // Format arrival window
  const arrivalDate = new Date(referenceTimeMs + estimatedArrivalInMin * 60000);
  const arrH = arrivalDate.getHours();
  const arrM = arrivalDate.getMinutes();
  const estTimeFormatted = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;

  let confidenceLevel: ETAResult['confidenceLevel'] = 'Limited Information';
  if (confidenceScore >= 75) {
    confidenceLevel = 'High';
  } else if (confidenceScore >= 50) {
    confidenceLevel = 'Moderate';
  }

  return {
    routeId: route.id,
    stopId: targetStopId,
    stopName,
    scheduledTime: scheduledTimeStr,
    estimatedArrivalMin: estimatedArrivalInMin,
    estimatedArrivalTimeFormatted: estTimeFormatted,
    confidenceScore,
    confidenceLevel,
    status,
    delayMinutes,
    lastReportAgeMinutes: bestReport ? Math.max(0, Math.round((referenceTimeMs - bestReport.timestamp) / 60000)) : undefined,
    supportingReportsCount: activeReports.length,
    assumptions,
  };
}

function getStopName(stopId: string, allStops: BusStop[]): string {
  const s = allStops.find((st) => st.id === stopId);
  return s ? s.name : stopId;
}
