'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Dices, Loader2, Lock, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

import { assignGridNumbers } from '../actions/assign-grid-numbers';

interface Contest {
  id: string;
  status: string;
  row_numbers: number[] | null;
  col_numbers: number[] | null;
  numbers_auto_generated: boolean | null;
  row_team_name: string | null;
  col_team_name: string | null;
}

interface ManageNumbersModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: Contest;
  onSuccess?: () => void;
}

/**
 * Mini grid preview showing row and column numbers
 */
function GridPreview({
  rowNumbers,
  colNumbers,
  rowTeamName,
  colTeamName,
}: {
  rowNumbers: number[];
  colNumbers: number[];
  rowTeamName: string | null;
  colTeamName: string | null;
}) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <h4 className="text-sm font-medium text-zinc-300 mb-3">Preview</h4>
      <div className="flex flex-col items-center gap-2">
        {/* Column team name */}
        <div className="text-xs text-orange-400 font-medium">
          {colTeamName || 'Column Team'}
        </div>
        
        {/* Grid header with column numbers */}
        <div className="flex gap-1">
          <div className="w-6 h-6" /> {/* Corner spacer */}
          {colNumbers.map((num, idx) => (
            <div
              key={idx}
              className="w-6 h-6 flex items-center justify-center bg-zinc-700 text-xs font-medium text-zinc-300 rounded"
            >
              {num}
            </div>
          ))}
        </div>
        
        {/* Grid with row numbers */}
        <div className="flex items-center gap-2">
          {/* Row team name (rotated) */}
          <div
            className="text-xs text-orange-400 font-medium"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {rowTeamName || 'Row Team'}
          </div>
          
          {/* Row numbers */}
          <div className="flex flex-col gap-1">
            {rowNumbers.map((num, idx) => (
              <div
                key={idx}
                className="w-6 h-6 flex items-center justify-center bg-zinc-700 text-xs font-medium text-zinc-300 rounded"
              >
                {num}
              </div>
            ))}
          </div>
          
          {/* Grid placeholder */}
          <div className="w-[268px] h-[268px] bg-zinc-900/50 rounded border border-zinc-700 flex items-center justify-center">
            <span className="text-xs text-zinc-500">10x10 Grid</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Read-only display of current numbers
 */
function NumbersDisplay({
  label,
  numbers,
}: {
  label: string;
  numbers: number[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-zinc-300">{label}</Label>
      <div className="flex gap-1 flex-wrap">
        {numbers.map((num, idx) => (
          <div
            key={idx}
            className="w-8 h-8 flex items-center justify-center bg-zinc-800 border border-zinc-600 text-sm font-medium text-zinc-300 rounded"
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Validates that an array contains exactly the digits 0-9 with no duplicates
 */
function validateNumbers(arr: (number | null)[]): { valid: boolean; error?: string } {
  const filtered = arr.filter((n): n is number => n !== null);
  
  if (filtered.length !== 10) {
    return { valid: false, error: 'All 10 numbers are required' };
  }
  
  const unique = new Set(filtered);
  if (unique.size !== 10) {
    return { valid: false, error: 'Each number must be unique (no duplicates)' };
  }
  
  const hasInvalid = filtered.some((n) => n < 0 || n > 9);
  if (hasInvalid) {
    return { valid: false, error: 'Numbers must be between 0 and 9' };
  }
  
  return { valid: true };
}

export function ManageNumbersModal({
  isOpen,
  onClose,
  contest,
  onSuccess,
}: ManageNumbersModalProps) {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [isPending, startTransition] = useTransition();
  
  // Manual entry state
  const [rowInputs, setRowInputs] = useState<(number | null)[]>(
    contest.row_numbers ?? Array(10).fill(null)
  );
  const [colInputs, setColInputs] = useState<(number | null)[]>(
    contest.col_numbers ?? Array(10).fill(null)
  );
  const [rowError, setRowError] = useState<string | null>(null);
  const [colError, setColError] = useState<string | null>(null);
  
  // Preview state (for auto-generate preview before saving)
  const [previewNumbers, setPreviewNumbers] = useState<{
    row: number[];
    col: number[];
  } | null>(
    contest.row_numbers && contest.col_numbers
      ? { row: contest.row_numbers, col: contest.col_numbers }
      : null
  );

  const isLocked = contest.status === 'in_progress' || contest.status === 'completed';
  const hasExistingNumbers = contest.row_numbers !== null && contest.col_numbers !== null;

  const handleClose = () => {
    // Reset state when closing
    setRowInputs(contest.row_numbers ?? Array(10).fill(null));
    setColInputs(contest.col_numbers ?? Array(10).fill(null));
    setRowError(null);
    setColError(null);
    setPreviewNumbers(
      contest.row_numbers && contest.col_numbers
        ? { row: contest.row_numbers, col: contest.col_numbers }
        : null
    );
    onClose();
  };

  const handleInputChange = (
    type: 'row' | 'col',
    index: number,
    value: string
  ) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    
    // Validate single digit
    if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > 9)) {
      return;
    }
    
    if (type === 'row') {
      const newInputs = [...rowInputs];
      newInputs[index] = numValue;
      setRowInputs(newInputs);
      setRowError(null);
      
      // Update preview if we have valid numbers
      const validation = validateNumbers(newInputs);
      if (validation.valid && colInputs.every((n) => n !== null)) {
        setPreviewNumbers({ row: newInputs as number[], col: colInputs as number[] });
      }
    } else {
      const newInputs = [...colInputs];
      newInputs[index] = numValue;
      setColInputs(newInputs);
      setColError(null);
      
      // Update preview if we have valid numbers
      const validation = validateNumbers(newInputs);
      if (validation.valid && rowInputs.every((n) => n !== null)) {
        setPreviewNumbers({ row: rowInputs as number[], col: newInputs as number[] });
      }
    }
  };

  const handleAutoGenerate = () => {
    startTransition(async () => {
      const result = await assignGridNumbers({
        contestId: contest.id,
        rowNumbers: null,
        colNumbers: null,
        autoGenerate: true,
      });

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error.message,
          variant: 'destructive',
        });
        return;
      }

      if (result?.data) {
        setPreviewNumbers({
          row: result.data.rowNumbers,
          col: result.data.colNumbers,
        });
        
        toast({
          title: 'Numbers Assigned',
          description: 'Grid numbers have been randomly generated.',
        });
        
        onSuccess?.();
      }
    });
  };

  const handleManualSave = () => {
    // Validate inputs
    const rowValidation = validateNumbers(rowInputs);
    const colValidation = validateNumbers(colInputs);
    
    if (!rowValidation.valid) {
      setRowError(rowValidation.error ?? 'Invalid row numbers');
      return;
    }
    
    if (!colValidation.valid) {
      setColError(colValidation.error ?? 'Invalid column numbers');
      return;
    }

    startTransition(async () => {
      const result = await assignGridNumbers({
        contestId: contest.id,
        rowNumbers: rowInputs as number[],
        colNumbers: colInputs as number[],
        autoGenerate: false,
      });

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error.message,
          variant: 'destructive',
        });
        return;
      }

      if (result?.data) {
        setPreviewNumbers({
          row: result.data.rowNumbers,
          col: result.data.colNumbers,
        });
        
        toast({
          title: 'Numbers Saved',
          description: 'Grid numbers have been saved.',
        });
        
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Grid Numbers</DialogTitle>
          <DialogDescription>
            Assign numbers 0-9 to each row and column of the grid.
          </DialogDescription>
        </DialogHeader>

        {isLocked ? (
          <>
            {/* Locked state - read only */}
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200">
                Numbers cannot be changed after the game has started.
              </p>
            </div>

            {hasExistingNumbers && (
              <div className="space-y-4">
                <NumbersDisplay
                  label={contest.row_team_name ?? 'Row Numbers'}
                  numbers={contest.row_numbers!}
                />
                <NumbersDisplay
                  label={contest.col_team_name ?? 'Column Numbers'}
                  numbers={contest.col_numbers!}
                />
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Warning if numbers exist */}
            {hasExistingNumbers && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  This will replace the current numbers.
                </p>
              </div>
            )}

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'auto' | 'manual')}
            >
              <TabsList className="w-full">
                <TabsTrigger value="auto" className="flex-1 gap-2">
                  <Dices className="h-4 w-4" />
                  Auto-Generate
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex-1 gap-2">
                  <Pencil className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Randomly assign numbers 0-9 to each row and column. The order
                  will be shuffled for fairness.
                </p>

                <Button
                  onClick={handleAutoGenerate}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Dices className="mr-2 h-4 w-4" />
                      Generate Random Numbers
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Enter your own number order for each axis. Each number 0-9 must
                  appear exactly once.
                </p>

                {/* Row inputs */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">
                    {contest.row_team_name ?? 'Row'} Numbers
                  </Label>
                  <div className="flex gap-1 flex-wrap">
                    {rowInputs.map((num, idx) => (
                      <Input
                        key={idx}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={num ?? ''}
                        onChange={(e) => handleInputChange('row', idx, e.target.value)}
                        className={`w-9 h-9 text-center p-0 ${
                          rowError ? 'border-red-500' : ''
                        }`}
                        placeholder={String(idx)}
                      />
                    ))}
                  </div>
                  {rowError && (
                    <p className="text-sm text-red-400">{rowError}</p>
                  )}
                </div>

                {/* Column inputs */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">
                    {contest.col_team_name ?? 'Column'} Numbers
                  </Label>
                  <div className="flex gap-1 flex-wrap">
                    {colInputs.map((num, idx) => (
                      <Input
                        key={idx}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={num ?? ''}
                        onChange={(e) => handleInputChange('col', idx, e.target.value)}
                        className={`w-9 h-9 text-center p-0 ${
                          colError ? 'border-red-500' : ''
                        }`}
                        placeholder={String(idx)}
                      />
                    ))}
                  </div>
                  {colError && (
                    <p className="text-sm text-red-400">{colError}</p>
                  )}
                </div>

                <Button
                  onClick={handleManualSave}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Numbers'
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Preview section */}
            {previewNumbers && (
              <GridPreview
                rowNumbers={previewNumbers.row}
                colNumbers={previewNumbers.col}
                rowTeamName={contest.row_team_name}
                colTeamName={contest.col_team_name}
              />
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

