interface WinnerEmailParams {
  participantName: string;
  contestName: string;
  quarterName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  prizeAmount: number;
  contestUrl: string;
}

export function winnerEmail({
  participantName,
  contestName,
  quarterName,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  prizeAmount,
  contestUrl,
}: WinnerEmailParams): { subject: string; html: string } {
  const subject = `🏆 You won ${quarterName} in ${contestName}!`;

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
            <td style="background: linear-gradient(135deg, #F97316 0%, #FBBF24 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Fundwell</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #27272A; padding: 32px; border-radius: 0 0 8px 8px;">
              
              <!-- Trophy & Winner Text -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="font-size: 64px; line-height: 1;">🏆</div>
                    <h2 style="margin: 16px 0 0 0; color: #FBBF24; font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                      WINNER!
                    </h2>
                  </td>
                </tr>
              </table>
              
              <!-- Congratulations -->
              <p style="margin: 0 0 8px 0; color: #fafafa; font-size: 20px; text-align: center; font-weight: 600;">
                Congratulations ${participantName}!
              </p>
              
              <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; text-align: center;">
                You won <strong style="color: #F97316;">${quarterName}</strong> in <strong style="color: #fafafa;">${contestName}</strong>!
              </p>
              
              <!-- Score Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #3f3f46; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                      Final Score
                    </h3>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 16px; background-color: #52525b; border-radius: 6px 6px 0 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #fafafa; font-size: 16px; font-weight: 600;">${homeTeamName}</td>
                              <td style="color: #fafafa; font-size: 24px; font-weight: bold; text-align: right;">${homeScore}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; background-color: #52525b; border-radius: 0 0 6px 6px; border-top: 1px solid #71717a;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #fafafa; font-size: 16px; font-weight: 600;">${awayTeamName}</td>
                              <td style="color: #fafafa; font-size: 24px; font-weight: bold; text-align: right;">${awayScore}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Prize Amount -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; color: #a1a1aa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Your Prize
                    </p>
                    <p style="margin: 0; color: #22c55e; font-size: 48px; font-weight: bold;">
                      $${prizeAmount.toLocaleString()}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${contestUrl}" style="display: inline-block; background: linear-gradient(135deg, #F97316 0%, #FBBF24 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
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
                🎉 Congratulations from The Fundwell Team 🎉
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
