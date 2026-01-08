'use client';

import { useState, useTransition } from 'react';
import { Copy, Loader2, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { updateContest } from '@/features/contests/actions/update-contest';
import { Player } from '@/features/contests/types/player';
import { generatePlayerSlug } from '@/features/contests/utils/player-slug';
import { Database } from '@/libs/supabase/types';
import { getURL } from '@/utils/get-url';

type Contest = Database['public']['Tables']['contests']['Row'];

interface PlayerTrackingSectionProps {
  contest: Contest;
  squaresPerPlayer?: Record<string, number>;
}

export function PlayerTrackingSection({ contest, squaresPerPlayer = {} }: PlayerTrackingSectionProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const players = (contest.players as unknown as Player[]) || [];
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);
  const [isEnabled, setIsEnabled] = useState(contest.enable_player_tracking);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; number?: string }>({
    defaultValues: { name: '', number: '' },
  });

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    startTransition(async () => {
      const result = await updateContest(contest.id, {
        enable_player_tracking: enabled,
      });

      if (result?.error) {
        setIsEnabled(!enabled);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message,
        });
        return;
      }

      toast({
        title: enabled ? 'Player tracking enabled' : 'Player tracking disabled',
      });
    });
  };

  const handleAddPlayer = (data: { name: string; number?: string }) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) return;

    // Check for duplicate names
    if (localPlayers.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Duplicate name',
        description: 'A player with this name already exists.',
      });
      return;
    }

    const newPlayer: Player = {
      name: trimmedName,
      number: data.number ? parseInt(data.number, 10) : undefined,
      slug: generatePlayerSlug(trimmedName, localPlayers),
    };

    const updatedPlayers = [...localPlayers, newPlayer];
    setLocalPlayers(updatedPlayers);
    reset();

    startTransition(async () => {
      const result = await updateContest(contest.id, {
        players: updatedPlayers as unknown as Database['public']['Tables']['contests']['Update']['players'],
      });

      if (result?.error) {
        setLocalPlayers(localPlayers);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message,
        });
        return;
      }

      toast({
        title: 'Player added',
        description: `${newPlayer.name} has been added.`,
      });
    });
  };

  const handleRemovePlayer = (slug: string) => {
    const updatedPlayers = localPlayers.filter((p) => p.slug !== slug);
    const removedPlayer = localPlayers.find((p) => p.slug === slug);
    setLocalPlayers(updatedPlayers);

    startTransition(async () => {
      const result = await updateContest(contest.id, {
        players: updatedPlayers as unknown as Database['public']['Tables']['contests']['Update']['players'],
      });

      if (result?.error) {
        setLocalPlayers(localPlayers);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message,
        });
        return;
      }

      toast({
        title: 'Player removed',
        description: `${removedPlayer?.name} has been removed.`,
      });
    });
  };

  const copyLink = async (player: Player) => {
    const url = `${getURL()}/contest/${contest.slug}?ref=${player.slug}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied',
      description: `Referral link for ${player.name} copied to clipboard.`,
    });
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-white">Player Tracking</CardTitle>
        <CardDescription>Track which team members sell squares</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="space-y-0.5">
            <Label htmlFor="enable_tracking" className="text-base">Enable player tracking</Label>
            <p className="text-sm text-zinc-400">
              Give each team member a unique link to track their sales
            </p>
          </div>
          <Switch
            id="enable_tracking"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>

        {/* Player Management */}
        {isEnabled && (
          <>
            {/* Add Player Form */}
            <form onSubmit={handleSubmit(handleAddPlayer)} className="space-y-3">
              <Label>Add Team Member</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Name"
                  {...register('name', { required: true })}
                  className="border-zinc-700 bg-zinc-800 flex-1"
                />
                <Input
                  placeholder="# (optional)"
                  type="number"
                  {...register('number')}
                  className="border-zinc-700 bg-zinc-800 w-24"
                />
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span className="ml-1">Add</span>
                </Button>
              </div>
            </form>

            {/* Player List */}
            {localPlayers.length > 0 && (
              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="space-y-2">
                  {localPlayers.map((player) => (
                    <div
                      key={player.slug}
                      className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {player.name}
                          {player.number !== undefined && (
                            <span className="ml-2 text-zinc-400">#{player.number}</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {squaresPerPlayer[player.name] || 0} squares sold
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(player)}
                          className="border-zinc-700"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer(player.slug)}
                          disabled={isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {localPlayers.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">
                No team members added yet. Add players above to generate referral links.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

