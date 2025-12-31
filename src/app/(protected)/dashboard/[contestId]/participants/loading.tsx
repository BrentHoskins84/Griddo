import { LoadingSpinner } from '@/components/shared';

export default function ParticipantsLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" text="Loading participants..." />
    </div>
  );
}

