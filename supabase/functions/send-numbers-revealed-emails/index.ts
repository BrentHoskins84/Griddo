// @ts-nocheck - Deno Edge Function (not Node.js)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NumbersRevealedEmailParams {
  participantName: string;
  contestName: string;
  rowTeamName: string;
  colTeamName: string;
  rowIndex: number;
  colIndex: number;
  rowNumber: number;
  colNumber: number;
  contestUrl: string;
}

/**
 * Escapes HTML special characters to prevent XSS/HTML injection in emails.
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes a string for use in email subject lines.
 * Removes newlines, carriage returns, and control characters to prevent header injection.
 */
function sanitizeSubject(unsafe: string): string {
  return unsafe
    .replace(/[\r\n]/g, ' ') // Replace newlines with spaces to prevent header injection
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

function generateNumbersRevealedEmail({
  participantName,
  contestName,
  rowTeamName,
  colTeamName,
  rowIndex,
  colIndex,
  rowNumber,
  colNumber,
  contestUrl,
}: NumbersRevealedEmailParams): { subject: string; html: string } {
  // Escape user-provided values to prevent HTML injection
  const safeParticipantName = escapeHtml(participantName);
  const safeContestName = escapeHtml(contestName);
  const safeRowTeamName = escapeHtml(rowTeamName);
  const safeColTeamName = escapeHtml(colTeamName);

  // Sanitize contest name for subject line (prevent header injection)
  const subjectSafeContestName = sanitizeSubject(contestName);
  const subject = `Numbers are in for ${subjectSafeContestName}!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #18181B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #18181B;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #F97316; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Griddo</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #27272A; padding: 32px; border-radius: 0 0 8px 8px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #fafafa; font-size: 16px;">
                Hi ${safeParticipantName},
              </p>
              
              <p style="margin: 0 0 24px 0; color: #fafafa; font-size: 16px;">
                The numbers have been revealed for <strong style="color: #F97316;">${safeContestName}</strong>!
              </p>
              
              <!-- Square Details Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #3f3f46; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 16px 0; color: #fafafa; font-size: 18px; font-weight: 600;">
                      Your Square
                    </h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Position:</td>
                        <td style="padding: 8px 0; color: #fafafa; font-size: 14px; text-align: right;">
                          Row ${rowIndex}, Column ${colIndex}
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Numbers Display -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                      <tr>
                        <td style="padding: 12px; background-color: #27272A; border-radius: 6px; text-align: center;">
                          <p style="margin: 0 0 4px 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase;">
                            ${safeRowTeamName}
                          </p>
                          <p style="margin: 0; color: #F97316; font-size: 32px; font-weight: bold;">
                            ${rowNumber}
                          </p>
                        </td>
                        <td style="width: 16px;"></td>
                        <td style="padding: 12px; background-color: #27272A; border-radius: 6px; text-align: center;">
                          <p style="margin: 0 0 4px 0; color: #a1a1aa; font-size: 12px; text-transform: uppercase;">
                            ${safeColTeamName}
                          </p>
                          <p style="margin: 0; color: #F97316; font-size: 32px; font-weight: bold;">
                            ${colNumber}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${contestUrl}" style="display: inline-block; background-color: #F97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      View Contest
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0; color: #71717a; font-size: 14px;">
                Good luck! - The Griddo Team
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { contestId?: string };
  try {
    body = await req.json();
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { contestId } = body;

  if (!contestId) {
    return new Response(JSON.stringify({ error: 'contestId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate required environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const missingEnvVars: string[] = [];
  if (!supabaseUrl) missingEnvVars.push('SUPABASE_URL');
  if (!supabaseServiceRoleKey) missingEnvVars.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    return new Response(
      JSON.stringify({ error: `Missing required environment variables: ${missingEnvVars.join(', ')}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

  // Fetch contest
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, name, slug, row_team_name, col_team_name, row_numbers, col_numbers')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    console.log('Contest fetch error:', contestError);
    return new Response(JSON.stringify({ error: 'Contest not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!contest.row_numbers || !contest.col_numbers) {
    console.log('Numbers not set for contest:', contestId);
    return new Response(JSON.stringify({ error: 'Numbers not set for this contest' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch squares with participants
  const { data: squares, error: squaresError } = await supabase
    .from('squares')
    .select('id, row_index, col_index, claimant_first_name, claimant_email, payment_status')
    .eq('contest_id', contestId)
    .in('payment_status', ['pending', 'paid'])
    .not('claimant_email', 'is', null);

  if (squaresError) {
    console.log('Squares fetch error:', squaresError);
    return new Response(JSON.stringify({ error: 'Failed to fetch squares' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!squares || squares.length === 0) {
    console.log('No squares with participants found for contest:', contestId);
    return new Response(JSON.stringify({ success: true, sent: 0, failed: 0, message: 'No participants to notify' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured');
    return new Response(JSON.stringify({ error: 'Email service not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const baseUrl = Deno.env.get('SITE_URL') || 'https://fundwell.us';
  const contestUrl = `${baseUrl}/contest/${encodeURIComponent(contest.slug)}`;

  let successCount = 0;
  let failCount = 0;

  for (const square of squares) {
    // Validate array indices before accessing
    const rowIndex = square.row_index;
    const colIndex = square.col_index;
    const rowNumbers = contest.row_numbers as number[];
    const colNumbers = contest.col_numbers as number[];

    if (rowIndex < 0 || rowIndex >= rowNumbers.length || colIndex < 0 || colIndex >= colNumbers.length) {
      console.warn(
        `Skipping square with invalid indices: square_id=${square.id}, row_index=${rowIndex}, col_index=${colIndex}, ` +
          `row_numbers.length=${rowNumbers.length}, col_numbers.length=${colNumbers.length}`
      );
      failCount++;
      continue;
    }

    const rowNumber = rowNumbers[rowIndex];
    const colNumber = colNumbers[colIndex];

    // Extra safety check for undefined values (shouldn't happen after bounds check)
    if (rowNumber === undefined || colNumber === undefined) {
      console.warn(
        `Skipping square with undefined numbers: square_id=${square.id}, row_index=${rowIndex}, col_index=${colIndex}, ` +
          `rowNumber=${rowNumber}, colNumber=${colNumber}`
      );
      failCount++;
      continue;
    }

    const { subject, html } = generateNumbersRevealedEmail({
      participantName: square.claimant_first_name || 'Participant',
      contestName: contest.name,
      rowTeamName: contest.row_team_name,
      colTeamName: contest.col_team_name,
      rowIndex: square.row_index,
      colIndex: square.col_index,
      rowNumber,
      colNumber,
      contestUrl,
    });

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM_EMAIL') || 'Griddo <no-reply@griddo.us>',
          to: square.claimant_email,
          subject,
          html,
        }),
      });

      if (response.ok) {
        successCount++;
        console.log(`Email sent successfully for square_id=${square.id}`);
      } else {
        failCount++;
        const errorData = await response.text();
        console.log(`Failed to send email for square_id=${square.id}:`, errorData);
      }
    } catch (error) {
      failCount++;
      console.log(`Error sending email for square_id=${square.id}:`, error);
    }
  }

  console.log(`Numbers revealed emails complete. Sent: ${successCount}, Failed: ${failCount}`);

  return new Response(JSON.stringify({ success: true, sent: successCount, failed: failCount }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
