'use client';

import { useState, useTransition } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  Play,
  RefreshCw,
  Trophy,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  resendQuarterEmails,
  toggleScoreChecking,
  triggerScoreCheck,
} from '@/features/super-bowl/actions';

// =============================================================================
// Types
// =============================================================================

interface Config {
  id: string;
  enabled: boolean;
  game_date: string;
  last_checked_at: string | null;
  last_status: string | null;
  last_period: number | null;
  game_finished: boolean;
}

interface LogEntry {
  id: string;
  action: string;
  status: string;
  details: unknown;
  error_message: string | null;
  created_at: string;
}

interface QuarterResult {
  id: string;
  contest_id: string;
  quarter: string;
  home_score: number;
  away_score: number;
  home_last_digit: number;
  away_last_digit: number;
  winner_first_name: string | null;
  winner_last_name: string | null;
  winner_email: string | null;
  winner_venmo: string | null;
  prize_amount: number | null;
  winner_email_sent: boolean;
  owner_email_sent: boolean;
  processed_at: string;
  contests?: { name: string } | null;
}

interface Contest {
  id: string;
  name: string;
  status: string;
  slug: string;
  is_super_bowl: boolean;
}

interface Props {
  initialConfig: Config | null;
  initialLogs: LogEntry[];
  initialResults: QuarterResult[];
  initialContests: Contest[];
}

// =============================================================================
// Helpers
// =============================================================================

const QUARTER_NAMES: Record<string, string> = {
  q1: 'Q1',
  q2: 'Halftime',
  q3: 'Q3',
  final: 'Final',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary';
  return (
    <Badge variant={variant} className='text-xs'>
      {status}
    </Badge>
  );
}

// =============================================================================
// Component
// =============================================================================

export function SuperBowlAdmin({ initialConfig, initialLogs, initialResults, initialContests }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Toggle enabled
  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleScoreChecking(checked);
      if (!result || result.error) {
        toast({ title: 'Error', description: result?.error?.message ?? 'Unknown error', variant: 'destructive' });
      } else {
        setConfig((prev) => (prev ? { ...prev, enabled: checked } : prev));
        toast({ title: checked ? 'Score checking enabled' : 'Score checking disabled' });
      }
    });
  }

  // Manual trigger
  function handleTrigger(quarter?: string) {
    startTransition(async () => {
      const result = await triggerScoreCheck(quarter, true);
      if (!result || result.error) {
        toast({ title: 'Error', description: result?.error?.message ?? 'Unknown error', variant: 'destructive' });
      } else {
        toast({ title: 'Score check triggered', description: `Status: ${result.data?.status}` });
      }
    });
  }

  // Resend emails
  function handleResend(resultId: string) {
    startTransition(async () => {
      const result = await resendQuarterEmails(resultId);
      if (!result || result.error) {
        toast({ title: 'Error', description: result?.error?.message ?? 'Unknown error', variant: 'destructive' });
      } else {
        toast({ title: 'Emails queued for resend' });
      }
    });
  }

  return (
    <Tabs defaultValue='controls' className='space-y-4'>
      <TabsList className='bg-zinc-800'>
        <TabsTrigger value='controls'>Controls</TabsTrigger>
        <TabsTrigger value='results'>Results ({initialResults.length})</TabsTrigger>
        <TabsTrigger value='logs'>Logs ({initialLogs.length})</TabsTrigger>
        <TabsTrigger value='contests'>Contests ({initialContests.length})</TabsTrigger>
      </TabsList>

      {/* ================================================================== */}
      {/* Controls Tab */}
      {/* ================================================================== */}
      <TabsContent value='controls' className='space-y-4'>
        {/* Status Cards */}
        <div className='grid gap-4 md:grid-cols-3'>
          {/* Enable/Disable */}
          <Card className='border-zinc-800 bg-zinc-900'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-base text-white'>
                <Zap className='h-4 w-4 text-orange-500' />
                Score Checking
              </CardTitle>
              <CardDescription>Enable or disable automated checking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-zinc-400'>
                  {config?.enabled ? 'Active' : 'Disabled'}
                </span>
                <Switch
                  checked={config?.enabled || false}
                  onCheckedChange={handleToggle}
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Last Check */}
          <Card className='border-zinc-800 bg-zinc-900'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-base text-white'>
                <Clock className='h-4 w-4 text-blue-400' />
                Last Check
              </CardTitle>
              <CardDescription>Most recent ESPN API check</CardDescription>
            </CardHeader>
            <CardContent className='space-y-1'>
              <p className='text-sm text-zinc-300'>{formatDate(config?.last_checked_at ?? null)}</p>
              {config?.last_status && (
                <p className='text-xs text-zinc-500'>
                  Status: {config.last_status} | Period: {config.last_period ?? '-'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Game Status */}
          <Card className='border-zinc-800 bg-zinc-900'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-base text-white'>
                <Activity className='h-4 w-4 text-green-400' />
                Game Status
              </CardTitle>
              <CardDescription>Current game state</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge
                variant={config?.game_finished ? 'default' : 'secondary'}
                className={config?.game_finished ? 'bg-green-600' : ''}
              >
                {config?.game_finished ? 'Game Complete' : 'Awaiting / In Progress'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Manual Trigger */}
        <Card className='border-zinc-800 bg-zinc-900'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base text-white'>
              <Play className='h-4 w-4 text-orange-500' />
              Manual Trigger
            </CardTitle>
            <CardDescription>
              Manually trigger score checking or process a specific quarter
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-3'>
            <Button
              onClick={() => handleTrigger()}
              disabled={isPending}
              className='bg-orange-600 hover:bg-orange-700'
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              Check Scores Now
            </Button>
            {['q1', 'q2', 'q3', 'final'].map((q) => (
              <Button
                key={q}
                variant='outline'
                onClick={() => handleTrigger(q)}
                disabled={isPending}
                className='border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              >
                Process {QUARTER_NAMES[q]}
              </Button>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ================================================================== */}
      {/* Results Tab */}
      {/* ================================================================== */}
      <TabsContent value='results'>
        <Card className='border-zinc-800 bg-zinc-900'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base text-white'>
              <Trophy className='h-4 w-4 text-amber-400' />
              Quarter Results
            </CardTitle>
            <CardDescription>Processed quarter results across all contests</CardDescription>
          </CardHeader>
          <CardContent>
            {initialResults.length === 0 ? (
              <p className='py-8 text-center text-sm text-zinc-500'>No results yet</p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-zinc-800'>
                      <TableHead className='text-zinc-400'>Contest</TableHead>
                      <TableHead className='text-zinc-400'>Quarter</TableHead>
                      <TableHead className='text-zinc-400'>Score</TableHead>
                      <TableHead className='text-zinc-400'>Digits</TableHead>
                      <TableHead className='text-zinc-400'>Winner</TableHead>
                      <TableHead className='text-zinc-400'>Prize</TableHead>
                      <TableHead className='text-zinc-400'>Emails</TableHead>
                      <TableHead className='text-zinc-400'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialResults.map((r) => (
                      <TableRow key={r.id} className='border-zinc-800'>
                        <TableCell className='text-sm text-zinc-300'>
                          {(r.contests as { name: string } | null)?.name || r.contest_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='border-orange-600 text-orange-400'>
                            {QUARTER_NAMES[r.quarter] || r.quarter}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm text-zinc-300'>
                          {r.home_score} - {r.away_score}
                        </TableCell>
                        <TableCell className='text-sm text-zinc-500'>
                          {r.home_last_digit} / {r.away_last_digit}
                        </TableCell>
                        <TableCell className='text-sm text-zinc-300'>
                          {r.winner_first_name
                            ? `${r.winner_first_name} ${r.winner_last_name || ''}`
                            : 'Unclaimed'}
                        </TableCell>
                        <TableCell className='text-sm font-medium text-green-400'>
                          {r.prize_amount ? `$${r.prize_amount}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            {r.winner_email_sent ? (
                              <CheckCircle2 className='h-4 w-4 text-green-500' />
                            ) : (
                              <AlertCircle className='h-4 w-4 text-yellow-500' />
                            )}
                            {r.owner_email_sent ? (
                              <CheckCircle2 className='h-4 w-4 text-green-500' />
                            ) : (
                              <AlertCircle className='h-4 w-4 text-yellow-500' />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleResend(r.id)}
                            disabled={isPending}
                            className='text-zinc-400 hover:text-white'
                          >
                            <Mail className='mr-1 h-3 w-3' />
                            Resend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ================================================================== */}
      {/* Logs Tab */}
      {/* ================================================================== */}
      <TabsContent value='logs'>
        <Card className='border-zinc-800 bg-zinc-900'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base text-white'>
              <Activity className='h-4 w-4 text-blue-400' />
              Processing Log
            </CardTitle>
            <CardDescription>Recent score check and processing attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {initialLogs.length === 0 ? (
              <p className='py-8 text-center text-sm text-zinc-500'>No logs yet</p>
            ) : (
              <div className='max-h-[600px] overflow-y-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-zinc-800'>
                      <TableHead className='text-zinc-400'>Time</TableHead>
                      <TableHead className='text-zinc-400'>Action</TableHead>
                      <TableHead className='text-zinc-400'>Status</TableHead>
                      <TableHead className='text-zinc-400'>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialLogs.map((log) => (
                      <TableRow key={log.id} className='border-zinc-800'>
                        <TableCell className='whitespace-nowrap text-xs text-zinc-500'>
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell className='text-sm text-zinc-300'>{log.action}</TableCell>
                        <TableCell>
                          <StatusBadge status={log.status} />
                        </TableCell>
                        <TableCell className='max-w-xs truncate text-xs text-zinc-500'>
                          {log.error_message || JSON.stringify(log.details).slice(0, 100)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ================================================================== */}
      {/* Contests Tab */}
      {/* ================================================================== */}
      <TabsContent value='contests'>
        <Card className='border-zinc-800 bg-zinc-900'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base text-white'>
              <Trophy className='h-4 w-4 text-orange-500' />
              Super Bowl Contests
            </CardTitle>
            <CardDescription>Contests flagged as Super Bowl</CardDescription>
          </CardHeader>
          <CardContent>
            {initialContests.length === 0 ? (
              <p className='py-8 text-center text-sm text-zinc-500'>
                No Super Bowl contests. Mark contests with <code>is_super_bowl = true</code> to include them.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className='border-zinc-800'>
                    <TableHead className='text-zinc-400'>Name</TableHead>
                    <TableHead className='text-zinc-400'>Status</TableHead>
                    <TableHead className='text-zinc-400'>Slug</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialContests.map((c) => (
                    <TableRow key={c.id} className='border-zinc-800'>
                      <TableCell className='text-sm font-medium text-zinc-300'>{c.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={
                            c.status === 'completed'
                              ? 'border-green-600 text-green-400'
                              : c.status === 'in_progress'
                                ? 'border-blue-600 text-blue-400'
                                : 'border-zinc-600 text-zinc-400'
                          }
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm text-zinc-500'>{c.slug}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
