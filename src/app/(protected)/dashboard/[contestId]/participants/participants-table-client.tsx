'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Download, Loader2, Search, Settings2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { bulkUpdateSquares } from '@/features/contests/actions/bulk-update-squares';
import { ManageSquare, ManageSquareModal } from '@/features/contests/components/manage-square-modal';
import { Participant } from '@/features/contests/queries/get-participants';

type FilterStatus = 'all' | 'pending' | 'paid';

interface ParticipantsTableClientProps {
  participants: Participant[];
  contestId: string;
  contestName: string;
  squarePrice: number;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateISO(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
}

function formatName(firstName: string | null, lastName: string | null): string {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name || '—';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ParticipantsTableClient({
  participants,
  contestId,
  contestName,
  squarePrice,
}: ParticipantsTableClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedSquare, setSelectedSquare] = useState<ManageSquare | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter participants based on search and status
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // Status filter
      if (filterStatus !== 'all' && p.payment_status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = formatName(p.claimant_first_name, p.claimant_last_name).toLowerCase();
        const email = (p.claimant_email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
      }

      return true;
    });
  }, [participants, searchQuery, filterStatus]);

  // Calculate counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: participants.length,
      pending: participants.filter((p) => p.payment_status === 'pending').length,
      paid: participants.filter((p) => p.payment_status === 'paid').length,
    };
  }, [participants]);

  // Check if all filtered participants are selected
  const allSelected = filteredParticipants.length > 0 && filteredParticipants.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all filtered
      const newSelected = new Set(selectedIds);
      filteredParticipants.forEach((p) => newSelected.delete(p.id));
      setSelectedIds(newSelected);
    } else {
      // Select all filtered
      const newSelected = new Set(selectedIds);
      filteredParticipants.forEach((p) => newSelected.add(p.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkMarkAsPaid = () => {
    startTransition(async () => {
      const result = await bulkUpdateSquares({
        contestId,
        squareIds: Array.from(selectedIds),
        newStatus: 'paid',
      });

      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: `${result?.data?.updated ?? 0} participant(s) marked as paid`,
      });

      setSelectedIds(new Set());
      router.refresh();
    });
  };

  const handleRowClick = (participant: Participant) => {
    setSelectedSquare(participant as ManageSquare);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSquare(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const handleExportCSV = () => {
    const headers = ['Square Position', 'Name', 'Email', 'Phone', 'Status', 'Claimed Date', 'Paid Date'];
    const rows = filteredParticipants.map((p) => [
      `Row ${p.row_index} Col ${p.col_index}`,
      formatName(p.claimant_first_name, p.claimant_last_name),
      p.claimant_email || '',
      p.claimant_venmo || '',
      p.payment_status,
      formatDateISO(p.claimed_at),
      formatDateISO(p.paid_at),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `${slugify(contestName)}-participants-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3">
          <span className="text-sm font-medium text-orange-300">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBulkMarkAsPaid}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark as Paid
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearSelection}
              disabled={isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Export Button */}
        <Button variant="secondary" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          All ({counts.all})
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
          className={filterStatus === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
        >
          Pending ({counts.pending})
        </Button>
        <Button
          variant={filterStatus === 'paid' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setFilterStatus('paid')}
          className={filterStatus === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          Paid ({counts.paid})
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[50px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                />
              </TableHead>
              <TableHead>Square</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Claimed</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-zinc-500">
                  {searchQuery || filterStatus !== 'all'
                    ? 'No participants match your filters.'
                    : 'No participants yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant) => (
                <TableRow
                  key={participant.id}
                  className="cursor-pointer"
                  data-state={selectedIds.has(participant.id) ? 'selected' : undefined}
                  onClick={() => handleRowClick(participant)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(participant.id)}
                      onChange={() => handleSelectOne(participant.id)}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="text-zinc-400">Row</span> {participant.row_index},{' '}
                    <span className="text-zinc-400">Col</span> {participant.col_index}
                  </TableCell>
                  <TableCell>
                    {formatName(participant.claimant_first_name, participant.claimant_last_name)}
                  </TableCell>
                  <TableCell>
                    {participant.claimant_email ? (
                      <a
                        href={`mailto:${participant.claimant_email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        {participant.claimant_email}
                      </a>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {participant.claimant_venmo || <span className="text-zinc-500">—</span>}
                  </TableCell>
                  <TableCell>
                    {participant.payment_status === 'pending' ? (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        Pending
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Paid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-zinc-400">
                    {formatDate(participant.claimed_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(participant);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Settings2 className="h-4 w-4" />
                      <span className="sr-only">Manage</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Manage Square Modal */}
      <ManageSquareModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        square={selectedSquare}
        contestId={contestId}
        squarePrice={squarePrice}
        onSuccess={handleSuccess}
      />
    </>
  );
}
