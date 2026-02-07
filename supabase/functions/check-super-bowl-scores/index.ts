// @ts-nocheck - Deno Edge Function (not Node.js)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================================================
// Types
// =============================================================================

interface ESPNResponse {
  events: ESPNEvent[];
}

interface ESPNEvent {
  name: string;
  season: { type: { name: string } };
  competitions: ESPNCompetition[];
}

interface ESPNCompetition {
  status: {
    period: number;
    type: { name: string; detail: string; completed: boolean };
  };
  competitors: ESPNCompetitor[];
}

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  team: { displayName: string; abbreviation: string };
  score: string;
}

interface ContestRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  row_team_name: string;
  col_team_name: string;
  row_numbers: number[];
  col_numbers: number[];
  square_price: number;
  payout_q1_percent: number | null;
  payout_q2_percent: number | null;
  payout_q3_percent: number | null;
  payout_final_percent: number | null;
  prize_type: string;
  prize_q1_text: string | null;
  prize_q2_text: string | null;
  prize_q3_text: string | null;
  prize_final_text: string | null;
  status: string;
}

interface SquareRow {
  id: string;
  row_index: number;
  col_index: number;
  claimant_first_name: string | null;
  claimant_last_name: string | null;
  claimant_email: string | null;
  claimant_venmo: string | null;
}

interface QuarterResult {
  contest_id: string;
  quarter: string;
  home_score: number;
  away_score: number;
  home_last_digit: number;
  away_last_digit: number;
  winning_square_id: string | null;
  winner_first_name: string | null;
  winner_last_name: string | null;
  winner_email: string | null;
  winner_venmo: string | null;
  prize_amount: number | null;
  payout_percent: number | null;
  winner_email_sent: boolean;
  owner_email_sent: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

// ESPN period -> our quarter mapping
const PERIOD_TO_QUARTER: Record<number, string> = {
  1: 'q1',
  2: 'q2', // halftime = end of Q2
  3: 'q3',
  4: 'final',
};

const QUARTER_DISPLAY: Record<string, string> = {
  q1: 'Q1',
  q2: 'Halftime',
  q3: 'Q3',
  final: 'Final',
};

// Statuses that trigger quarter processing
const QUARTER_END_STATUSES = ['STATUS_END_PERIOD', 'STATUS_HALFTIME', 'STATUS_FINAL'];

// =============================================================================
// Helpers
// =============================================================================

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildWinnerName(firstName: string | null, lastName: string | null): string {
  if (!firstName) return 'Unclaimed Square';
  return lastName ? `${firstName} ${lastName}` : firstName;
}

function getPayoutPercent(contest: ContestRow, quarter: string): number {
  const key = `payout_${quarter}_percent` as keyof ContestRow;
  return (contest[key] as number | null) || 0;
}

function getPrizeAmount(contest: ContestRow, quarter: string): number {
  const percent = getPayoutPercent(contest, quarter);
  const totalPot = contest.square_price * 100;
  return (totalPot * percent) / 100;
}

// =============================================================================
// ESPN API
// =============================================================================

async function fetchESPNScores(): Promise<{
  found: boolean;
  period?: number;
  statusName?: string;
  statusDetail?: string;
  completed?: boolean;
  homeScore?: number;
  awayScore?: number;
  homeTeam?: string;
  awayTeam?: string;
}> {
  const response = await fetch(ESPN_URL);
  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`);
  }

  const data: ESPNResponse = await response.json();

  // Find the Super Bowl game (postseason type 3)
  for (const event of data.events || []) {
    // Super Bowl is in the postseason
    if (event.season?.type?.name !== 'Postseason' && event.season?.type?.name !== 'Post Season') {
      // Also check event name as fallback
      if (!event.name?.toLowerCase().includes('super bowl')) continue;
    }

    const comp = event.competitions?.[0];
    if (!comp) continue;

    const homeComp = comp.competitors?.find((c) => c.homeAway === 'home');
    const awayComp = comp.competitors?.find((c) => c.homeAway === 'away');

    if (!homeComp || !awayComp) continue;

    return {
      found: true,
      period: comp.status?.period || 0,
      statusName: comp.status?.type?.name || '',
      statusDetail: comp.status?.type?.detail || '',
      completed: comp.status?.type?.completed || false,
      homeScore: parseInt(homeComp.score || '0', 10),
      awayScore: parseInt(awayComp.score || '0', 10),
      homeTeam: homeComp.team?.displayName || 'Home',
      awayTeam: awayComp.team?.displayName || 'Away',
    };
  }

  return { found: false };
}

// =============================================================================
// Email Templates (inline for edge function, matching Fundwell brand)
// =============================================================================

function generateWinnerNotificationEmail(params: {
  participantName: string;
  contestName: string;
  quarterName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  prizeAmount: number;
  contestUrl: string;
}): { subject: string; html: string } {
  const safe = {
    name: escapeHtml(params.participantName),
    contest: escapeHtml(params.contestName),
    quarter: escapeHtml(params.quarterName),
    home: escapeHtml(params.homeTeamName),
    away: escapeHtml(params.awayTeamName),
  };

  const subject = `🏆 You won ${params.quarterName} in ${params.contestName}!`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Winner!</title></head>
<body style="margin:0;padding:0;background-color:#18181B;font-family:Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#18181B;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;">
  <tr><td align="center" style="background:linear-gradient(135deg,#F97316 0%,#FBBF24 100%);border-radius:8px 8px 0 0;padding:24px;">
    <span style="color:#fff;font-size:28px;font-weight:bold;">Fundwell</span>
  </td></tr>
  <tr><td style="background-color:#27272A;padding:32px;border-radius:0 0 8px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:24px;">
        <div style="font-size:64px;line-height:1;">🏆</div>
        <h2 style="margin:16px 0 0;color:#FBBF24;font-size:32px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;">WINNER!</h2>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;color:#fafafa;font-size:20px;text-align:center;font-weight:600;">Congratulations ${safe.name}!</p>
    <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;text-align:center;">
      You won <strong style="color:#F97316;">${safe.quarter}</strong> in <strong style="color:#fafafa;">${safe.contest}</strong>!
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#3f3f46;border-radius:8px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <h3 style="margin:0 0 16px;color:#a1a1aa;font-size:14px;text-transform:uppercase;letter-spacing:1px;text-align:center;">Score at ${safe.quarter}</h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:12px 16px;background-color:#52525b;border-radius:6px 6px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="color:#fafafa;font-size:16px;font-weight:600;">${safe.home}</td>
              <td style="color:#fafafa;font-size:24px;font-weight:bold;text-align:right;">${params.homeScore}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:12px 16px;background-color:#52525b;border-radius:0 0 6px 6px;border-top:1px solid #71717a;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="color:#fafafa;font-size:16px;font-weight:600;">${safe.away}</td>
              <td style="color:#fafafa;font-size:24px;font-weight:bold;text-align:right;">${params.awayScore}</td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr><td align="center">
        <p style="margin:0 0 8px;color:#a1a1aa;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Your Prize</p>
        <p style="margin:0;color:#22c55e;font-size:48px;font-weight:bold;">$${params.prizeAmount.toLocaleString()}</p>
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0;">
        <a href="${params.contestUrl}" style="display:inline-block;background:linear-gradient(135deg,#F97316 0%,#FBBF24 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:6px;font-size:16px;font-weight:600;">View Contest</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:24px;">
    <span style="color:#71717a;font-size:14px;">- The Fundwell Team</span>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, html };
}

function generateOwnerQuarterEmail(params: {
  ownerName: string;
  contestName: string;
  quarterName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string;
  winnerEmail: string | null;
  winnerVenmo: string | null;
  prizeAmount: number;
}): { subject: string; html: string } {
  const safe = {
    owner: escapeHtml(params.ownerName),
    contest: escapeHtml(params.contestName),
    quarter: escapeHtml(params.quarterName),
    winner: escapeHtml(params.winnerName),
    email: params.winnerEmail ? escapeHtml(params.winnerEmail) : 'N/A',
    venmo: params.winnerVenmo ? escapeHtml(params.winnerVenmo) : 'N/A',
  };

  const subject = `${params.quarterName} Winner - ${params.contestName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${safe.quarter} Winner</title></head>
<body style="margin:0;padding:0;background-color:#18181B;font-family:Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#18181B;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;">
  <tr><td align="center" style="background-color:#F97316;border-radius:8px 8px 0 0;padding:24px;">
    <span style="color:#fff;font-size:28px;font-weight:bold;">Fundwell</span>
  </td></tr>
  <tr><td style="background-color:#27272A;padding:32px;border-radius:0 0 8px 8px;">
    <p style="margin:0 0 16px;color:#fafafa;font-size:16px;">Hi ${safe.owner},</p>
    <p style="margin:0 0 24px;color:#fafafa;font-size:16px;">
      <strong style="color:#F97316;">${safe.quarter}</strong> just ended in <strong>${safe.contest}</strong>!
      Here are the results:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#3f3f46;border-radius:8px;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 12px;color:#fafafa;font-size:18px;font-weight:600;">Score</p>
        <p style="margin:0 0 4px;color:#a1a1aa;font-size:14px;">${escapeHtml(params.homeTeamName)}: <strong style="color:#fafafa;">${params.homeScore}</strong></p>
        <p style="margin:0 0 16px;color:#a1a1aa;font-size:14px;">${escapeHtml(params.awayTeamName)}: <strong style="color:#fafafa;">${params.awayScore}</strong></p>
        <div style="border-top:1px solid #52525b;padding-top:16px;">
          <p style="margin:0 0 12px;color:#FBBF24;font-size:18px;font-weight:600;">Winner</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:4px 0;color:#a1a1aa;font-size:14px;">Name:</td><td style="padding:4px 0;color:#fafafa;font-size:14px;text-align:right;">${safe.winner}</td></tr>
            <tr><td style="padding:4px 0;color:#a1a1aa;font-size:14px;">Email:</td><td style="padding:4px 0;color:#fafafa;font-size:14px;text-align:right;">${safe.email}</td></tr>
            <tr><td style="padding:4px 0;color:#a1a1aa;font-size:14px;">Venmo:</td><td style="padding:4px 0;color:#fafafa;font-size:14px;text-align:right;">${safe.venmo}</td></tr>
            <tr><td style="padding:4px 0;color:#a1a1aa;font-size:14px;">Prize:</td><td style="padding:4px 0;color:#22c55e;font-size:14px;font-weight:bold;text-align:right;">$${params.prizeAmount.toLocaleString()}</td></tr>
          </table>
        </div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:24px;">
    <span style="color:#71717a;font-size:14px;">- The Fundwell Team</span>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, html };
}

function generateFinalSummaryEmail(params: {
  ownerName: string;
  contestName: string;
  homeTeamName: string;
  awayTeamName: string;
  winners: Array<{
    quarter: string;
    quarterName: string;
    homeScore: number;
    awayScore: number;
    winnerName: string;
    winnerEmail: string | null;
    winnerVenmo: string | null;
    prizeAmount: number;
  }>;
  totalPayout: number;
}): { subject: string; html: string } {
  const safe = {
    owner: escapeHtml(params.ownerName),
    contest: escapeHtml(params.contestName),
  };

  const subject = `Game Over! Final Summary - ${params.contestName}`;

  const winnerRows = params.winners
    .map(
      (w) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #52525b;color:#F97316;font-weight:600;font-size:14px;">${escapeHtml(w.quarterName)}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #52525b;color:#fafafa;font-size:14px;">${w.homeScore}-${w.awayScore}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #52525b;color:#fafafa;font-size:14px;">${escapeHtml(w.winnerName)}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #52525b;color:#fafafa;font-size:14px;">${w.winnerEmail ? escapeHtml(w.winnerEmail) : 'N/A'}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #52525b;color:#fafafa;font-size:14px;">${w.winnerVenmo ? escapeHtml(w.winnerVenmo) : 'N/A'}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #52525b;color:#22c55e;font-weight:bold;font-size:14px;">$${w.prizeAmount.toLocaleString()}</td>
    </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Game Summary</title></head>
<body style="margin:0;padding:0;background-color:#18181B;font-family:Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#18181B;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;">
  <tr><td align="center" style="background:linear-gradient(135deg,#F97316 0%,#FBBF24 100%);border-radius:8px 8px 0 0;padding:24px;">
    <span style="color:#fff;font-size:28px;font-weight:bold;">Fundwell</span>
  </td></tr>
  <tr><td style="background-color:#27272A;padding:32px;border-radius:0 0 8px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:24px;">
        <div style="font-size:64px;line-height:1;">🏈</div>
        <h2 style="margin:16px 0 0;color:#FBBF24;font-size:28px;font-weight:bold;">Game Over!</h2>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;color:#fafafa;font-size:16px;">Hi ${safe.owner},</p>
    <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;">
      The Super Bowl is over! Here's the complete winner summary for <strong style="color:#fafafa;">${safe.contest}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#3f3f46;border-radius:8px;margin-bottom:24px;overflow:hidden;">
      <tr>
        <th style="padding:12px 16px;text-align:left;color:#a1a1aa;font-size:12px;text-transform:uppercase;border-bottom:2px solid #52525b;">Quarter</th>
        <th style="padding:12px 16px;text-align:left;color:#a1a1aa;font-size:12px;text-transform:uppercase;border-bottom:2px solid #52525b;">Score</th>
        <th style="padding:12px 16px;text-align:left;color:#a1a1aa;font-size:12px;text-transform:uppercase;border-bottom:2px solid #52525b;">Winner</th>
        <th style="padding:12px 16px;text-align:left;color:#a1a1aa;font-size:12px;text-transform:uppercase;border-bottom:2px solid #52525b;">Email</th>
        <th style="padding:12px 16px;text-align:left;color:#a1a1aa;font-size:12px;text-transform:uppercase;border-bottom:2px solid #52525b;">Venmo</th>
        <th style="padding:12px 16px;text-align:left;color:#a1a1aa;font-size:12px;text-transform:uppercase;border-bottom:2px solid #52525b;">Prize</th>
      </tr>
      ${winnerRows}
      <tr>
        <td colspan="5" style="padding:12px 16px;color:#fafafa;font-size:14px;font-weight:bold;text-align:right;">Total Payout:</td>
        <td style="padding:12px 16px;color:#22c55e;font-size:16px;font-weight:bold;">$${params.totalPayout.toLocaleString()}</td>
      </tr>
    </table>
    <p style="margin:0;color:#a1a1aa;font-size:14px;text-align:center;">
      Your contest has been automatically marked as completed. All winners have been notified.
    </p>
  </td></tr>
  <tr><td align="center" style="padding:24px;">
    <span style="color:#71717a;font-size:14px;">- The Fundwell Team</span>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, html };
}

// =============================================================================
// Email Sending
// =============================================================================

async function sendEmail(
  resendApiKey: string,
  fromEmail: string,
  to: string,
  template: { subject: string; html: string }
): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send email to ${to}:`, errorText);
      return false;
    }

    console.log(`Email sent to ${to}: ${template.subject}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
}

// =============================================================================
// Core Processing
// =============================================================================

async function processQuarter(
  supabase: ReturnType<typeof createClient>,
  resendApiKey: string,
  fromEmail: string,
  baseUrl: string,
  contest: ContestRow,
  quarter: string,
  homeScore: number,
  awayScore: number
): Promise<{ processed: boolean; error?: string }> {
  const quarterName = QUARTER_DISPLAY[quarter] || quarter;

  // Check if already processed (idempotency)
  const { data: existing } = await supabase
    .from('super_bowl_quarter_results')
    .select('id, winner_email_sent, owner_email_sent')
    .eq('contest_id', contest.id)
    .eq('quarter', quarter)
    .single();

  if (existing?.winner_email_sent && existing?.owner_email_sent) {
    console.log(`Quarter ${quarter} already fully processed for contest ${contest.id}`);
    return { processed: false };
  }

  // Calculate last digits
  const homeLastDigit = homeScore % 10;
  const awayLastDigit = awayScore % 10;

  // Fetch squares for this contest
  const { data: squares, error: squaresError } = await supabase
    .from('squares')
    .select('id, row_index, col_index, claimant_first_name, claimant_last_name, claimant_email, claimant_venmo')
    .eq('contest_id', contest.id);

  if (squaresError || !squares) {
    return { processed: false, error: `Failed to fetch squares: ${squaresError?.message}` };
  }

  // Find winning square using same logic as save-scores.ts
  // row_numbers[row_index] = digit, so find index where value matches
  const winningRowIndex = contest.row_numbers?.indexOf(homeLastDigit) ?? -1;
  const winningColIndex = contest.col_numbers?.indexOf(awayLastDigit) ?? -1;

  let winningSquare: SquareRow | null = null;
  if (winningRowIndex !== -1 && winningColIndex !== -1) {
    winningSquare = squares.find(
      (sq: SquareRow) => sq.row_index === winningRowIndex && sq.col_index === winningColIndex
    ) || null;
  }

  const prizeAmount = getPrizeAmount(contest, quarter);
  const payoutPercent = getPayoutPercent(contest, quarter);

  // Build result record
  const result: QuarterResult = {
    contest_id: contest.id,
    quarter,
    home_score: homeScore,
    away_score: awayScore,
    home_last_digit: homeLastDigit,
    away_last_digit: awayLastDigit,
    winning_square_id: winningSquare?.id || null,
    winner_first_name: winningSquare?.claimant_first_name || null,
    winner_last_name: winningSquare?.claimant_last_name || null,
    winner_email: winningSquare?.claimant_email || null,
    winner_venmo: winningSquare?.claimant_venmo || null,
    prize_amount: prizeAmount,
    payout_percent: payoutPercent,
    winner_email_sent: false,
    owner_email_sent: false,
  };

  // Upsert the result (idempotent)
  const { error: upsertError } = await supabase
    .from('super_bowl_quarter_results')
    .upsert(result, { onConflict: 'contest_id,quarter' });

  if (upsertError) {
    return { processed: false, error: `Failed to upsert result: ${upsertError.message}` };
  }

  // Also upsert into the scores table (matches existing manual score entry)
  await supabase.from('scores').upsert(
    {
      contest_id: contest.id,
      quarter,
      home_score: homeScore,
      away_score: awayScore,
      winning_square_id: winningSquare?.id || null,
      entered_at: new Date().toISOString(),
    },
    { onConflict: 'contest_id,quarter' }
  );

  // If already partially processed, only send missing emails
  const needWinnerEmail = !existing?.winner_email_sent;
  const needOwnerEmail = !existing?.owner_email_sent;

  // Send winner email
  let winnerEmailSent = existing?.winner_email_sent || false;
  if (needWinnerEmail && winningSquare?.claimant_email) {
    const contestUrl = `${baseUrl}/contest/${encodeURIComponent(contest.slug)}`;
    const winnerTemplate = generateWinnerNotificationEmail({
      participantName: winningSquare.claimant_first_name || 'Winner',
      contestName: contest.name,
      quarterName,
      homeTeamName: contest.row_team_name,
      awayTeamName: contest.col_team_name,
      homeScore,
      awayScore,
      prizeAmount,
      contestUrl,
    });

    winnerEmailSent = await sendEmail(resendApiKey, fromEmail, winningSquare.claimant_email, winnerTemplate);
  } else if (!winningSquare?.claimant_email) {
    // No email to send (unclaimed square), mark as sent
    winnerEmailSent = true;
  }

  // Send owner email
  let ownerEmailSent = existing?.owner_email_sent || false;
  if (needOwnerEmail) {
    // Get owner's email from auth.users
    const { data: ownerData } = await supabase.auth.admin.getUserById(contest.owner_id);
    const ownerEmail = ownerData?.user?.email;
    const ownerName = ownerData?.user?.user_metadata?.full_name || ownerData?.user?.user_metadata?.name || 'Contest Owner';

    if (ownerEmail) {
      const ownerTemplate = generateOwnerQuarterEmail({
        ownerName,
        contestName: contest.name,
        quarterName,
        homeTeamName: contest.row_team_name,
        awayTeamName: contest.col_team_name,
        homeScore,
        awayScore,
        winnerName: buildWinnerName(winningSquare?.claimant_first_name || null, winningSquare?.claimant_last_name || null),
        winnerEmail: winningSquare?.claimant_email || null,
        winnerVenmo: winningSquare?.claimant_venmo || null,
        prizeAmount,
      });

      ownerEmailSent = await sendEmail(resendApiKey, fromEmail, ownerEmail, ownerTemplate);
    }
  }

  // Update email sent status
  await supabase
    .from('super_bowl_quarter_results')
    .update({
      winner_email_sent: winnerEmailSent,
      owner_email_sent: ownerEmailSent,
      winner_email_sent_at: winnerEmailSent ? new Date().toISOString() : null,
      owner_email_sent_at: ownerEmailSent ? new Date().toISOString() : null,
    })
    .eq('contest_id', contest.id)
    .eq('quarter', quarter);

  return { processed: true };
}

async function processGameComplete(
  supabase: ReturnType<typeof createClient>,
  resendApiKey: string,
  fromEmail: string,
  contest: ContestRow
): Promise<void> {
  // Fetch all quarter results for this contest
  const { data: results } = await supabase
    .from('super_bowl_quarter_results')
    .select('*')
    .eq('contest_id', contest.id)
    .order('quarter');

  if (!results || results.length === 0) return;

  // Get owner info
  const { data: ownerData } = await supabase.auth.admin.getUserById(contest.owner_id);
  const ownerEmail = ownerData?.user?.email;
  const ownerName = ownerData?.user?.user_metadata?.full_name || ownerData?.user?.user_metadata?.name || 'Contest Owner';

  if (!ownerEmail) return;

  const winners = results.map((r: any) => ({
    quarter: r.quarter,
    quarterName: QUARTER_DISPLAY[r.quarter] || r.quarter,
    homeScore: r.home_score,
    awayScore: r.away_score,
    winnerName: buildWinnerName(r.winner_first_name, r.winner_last_name),
    winnerEmail: r.winner_email,
    winnerVenmo: r.winner_venmo,
    prizeAmount: r.prize_amount || 0,
  }));

  const totalPayout = winners.reduce((sum: number, w: any) => sum + w.prizeAmount, 0);

  const summaryTemplate = generateFinalSummaryEmail({
    ownerName,
    contestName: contest.name,
    homeTeamName: contest.row_team_name,
    awayTeamName: contest.col_team_name,
    winners,
    totalPayout,
  });

  await sendEmail(resendApiKey, fromEmail, ownerEmail, summaryTemplate);

  // Mark contest as completed
  await supabase
    .from('contests')
    .update({ status: 'completed' })
    .eq('id', contest.id);
}

// =============================================================================
// Logging helper
// =============================================================================

async function log(
  supabase: ReturnType<typeof createClient>,
  action: string,
  status: string,
  details: Record<string, unknown> = {},
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('super_bowl_processing_log').insert({
      action,
      status,
      details,
      error_message: errorMessage || null,
    });
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (req: Request) => {
  const startTime = Date.now();

  // Allow both GET (cron) and POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse optional body for manual trigger
  let manualQuarter: string | null = null;
  let forceProcess = false;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      manualQuarter = body.quarter || null;
      forceProcess = body.force === true;
    } catch {
      // Empty body is fine for cron calls
    }
  }

  // Validate env vars
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
    const missing = [
      !supabaseUrl && 'SUPABASE_URL',
      !supabaseServiceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
      !resendApiKey && 'RESEND_API_KEY',
    ].filter(Boolean);
    return new Response(JSON.stringify({ error: `Missing env vars: ${missing.join(', ')}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Fundwell <no-reply@fundwell.us>';
  const baseUrl = Deno.env.get('SITE_URL') || 'https://fundwell.us';

  try {
    // Check config
    const { data: config, error: configError } = await supabase
      .from('super_bowl_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      await log(supabase, 'check_scores', 'error', {}, 'No super bowl config found');
      return new Response(JSON.stringify({ error: 'No config found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Exit early if disabled (unless manual force)
    if (!config.enabled && !forceProcess) {
      return new Response(JSON.stringify({ status: 'disabled', message: 'Score checking is disabled' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Exit early if game already finished (unless manual force)
    if (config.game_finished && !forceProcess) {
      return new Response(JSON.stringify({ status: 'finished', message: 'Game already finished' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch ESPN scores
    const espn = await fetchESPNScores();

    // Update last checked
    await supabase
      .from('super_bowl_config')
      .update({
        last_checked_at: new Date().toISOString(),
        last_status: espn.statusName || null,
        last_period: espn.period || null,
      })
      .eq('id', config.id);

    if (!espn.found) {
      await log(supabase, 'check_scores', 'skipped', { reason: 'no_super_bowl_game_found' });
      return new Response(JSON.stringify({ status: 'no_game', message: 'No Super Bowl game found on ESPN' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await log(supabase, 'check_scores', 'success', {
      period: espn.period,
      statusName: espn.statusName,
      statusDetail: espn.statusDetail,
      homeScore: espn.homeScore,
      awayScore: espn.awayScore,
      homeTeam: espn.homeTeam,
      awayTeam: espn.awayTeam,
    });

    // Determine which quarters to process
    const quartersToProcess: string[] = [];

    if (manualQuarter) {
      // Manual trigger for a specific quarter
      quartersToProcess.push(manualQuarter);
    } else if (espn.statusName === 'STATUS_FINAL' || espn.completed) {
      // Game is final - process all unprocessed quarters
      quartersToProcess.push('q1', 'q2', 'q3', 'final');
    } else if (
      espn.statusName === 'STATUS_END_PERIOD' ||
      espn.statusName === 'STATUS_HALFTIME'
    ) {
      // Quarter just ended - process current and all previous
      const period = espn.period || 0;
      for (let p = 1; p <= Math.min(period, 4); p++) {
        const q = PERIOD_TO_QUARTER[p];
        if (q) quartersToProcess.push(q);
      }
    } else {
      // Game in progress but no quarter end - nothing to process
      return new Response(
        JSON.stringify({
          status: 'in_progress',
          message: 'Game in progress, waiting for quarter end',
          period: espn.period,
          statusName: espn.statusName,
          score: `${espn.homeTeam} ${espn.homeScore} - ${espn.awayTeam} ${espn.awayScore}`,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (quartersToProcess.length === 0) {
      return new Response(JSON.stringify({ status: 'nothing_to_process' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all active Super Bowl contests
    const { data: contests, error: contestsError } = await supabase
      .from('contests')
      .select(
        'id, name, slug, owner_id, row_team_name, col_team_name, row_numbers, col_numbers, ' +
        'square_price, payout_q1_percent, payout_q2_percent, payout_q3_percent, payout_final_percent, ' +
        'prize_type, prize_q1_text, prize_q2_text, prize_q3_text, prize_final_text, status'
      )
      .eq('is_super_bowl', true)
      .eq('sport_type', 'football')
      .in('status', ['in_progress', 'locked', 'open'])
      .is('deleted_at', null);

    if (contestsError) {
      await log(supabase, 'fetch_contests', 'error', {}, contestsError.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch contests' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!contests || contests.length === 0) {
      await log(supabase, 'fetch_contests', 'skipped', { reason: 'no_active_super_bowl_contests' });
      return new Response(JSON.stringify({ status: 'no_contests', message: 'No active Super Bowl contests' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${quartersToProcess.length} quarter(s) for ${contests.length} contest(s)`);

    // Process each quarter for each contest
    const results: Array<{ contestId: string; quarter: string; processed: boolean; error?: string }> = [];

    for (const contest of contests) {
      // Skip contests without assigned numbers
      if (!contest.row_numbers || !contest.col_numbers) {
        console.log(`Skipping contest ${contest.id} - numbers not assigned`);
        continue;
      }

      for (const quarter of quartersToProcess) {
        const result = await processQuarter(
          supabase,
          resendApiKey,
          fromEmail,
          baseUrl,
          contest as ContestRow,
          quarter,
          espn.homeScore!,
          espn.awayScore!
        );

        results.push({
          contestId: contest.id,
          quarter,
          processed: result.processed,
          error: result.error,
        });

        if (result.error) {
          await log(supabase, 'process_quarter', 'error', {
            contestId: contest.id,
            quarter,
          }, result.error);
        } else if (result.processed) {
          await log(supabase, 'process_quarter', 'success', {
            contestId: contest.id,
            quarter,
            homeScore: espn.homeScore,
            awayScore: espn.awayScore,
          });
        }
      }
    }

    // Handle game completion
    const isGameFinal = espn.statusName === 'STATUS_FINAL' || espn.completed;
    if (isGameFinal) {
      for (const contest of contests) {
        try {
          await processGameComplete(supabase, resendApiKey, fromEmail, contest as ContestRow);
          await log(supabase, 'game_complete', 'success', { contestId: contest.id });
        } catch (error) {
          await log(supabase, 'game_complete', 'error', { contestId: contest.id }, String(error));
        }
      }

      // Mark game as finished in config
      await supabase
        .from('super_bowl_config')
        .update({ game_finished: true })
        .eq('id', config.id);
    }

    const elapsed = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        status: 'processed',
        quartersProcessed: quartersToProcess,
        contestCount: contests.length,
        results,
        gameFinished: isGameFinal,
        elapsedMs: elapsed,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    await log(supabase, 'unhandled_error', 'error', {}, String(error));

    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
