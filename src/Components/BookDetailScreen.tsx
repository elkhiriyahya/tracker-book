'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserBook, BookStatus } from '@/lib/types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent } from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import { toast } from 'sonner';
import {
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Star,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';

interface BookDetailScreenProps {
  userBook: UserBook;
  onBack: () => void;
  onUpdate: () => void;
}

const statusOptions: { value: BookStatus; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'reading',
    label: 'Reading',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'bg-emerald-500 text-white border-emerald-500',
  },
  {
    value: 'want_to_read',
    label: 'Want to Read',
    icon: <Clock className="w-4 h-4" />,
    color: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: 'finished',
    label: 'Finished',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-sky-500 text-white border-sky-500',
  },
  {
    value: 'dropped',
    label: 'Dropped',
    icon: <XCircle className="w-4 h-4" />,
    color: 'bg-stone-500 text-white border-stone-500',
  },
];

export default function BookDetailScreen({ userBook, onBack, onUpdate }: BookDetailScreenProps) {
  const [progressPage, setProgressPage] = useState(userBook.progress_page.toString());
  const [status, setStatus] = useState<BookStatus>(userBook.status);
  const [rating, setRating] = useState(userBook.rating || 0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const book = userBook.books;
  const totalPages = book?.total_pages || 0;

  const handleUpdateProgress = async () => {
    const newPage = Number.parseInt(progressPage) || 0;

    if (newPage < 0) {
      toast.error('Page number cannot be negative');
      return;
    }

    if (totalPages && newPage > totalPages) {
      toast.error(`Page number cannot exceed ${totalPages}`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_books')
        .update({
          progress_page: newPage,
          status: status,
          rating: rating > 0 ? rating : null,
        })
        .eq('id', userBook.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update progress');
        return;
      }

      toast.success('Progress updated!');
      onUpdate();
    } catch (err) {
      console.error('Error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('user_books').delete().eq('id', userBook.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to remove book');
        return;
      }

      toast.success('Book removed from library');
      setShowDeleteDialog(false);
      onUpdate();
      onBack();
    } catch (err) {
      console.error('Error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const getProgressPercentage = () => {
    if (!totalPages || totalPages === 0) return 0;
    const page = Number.parseInt(progressPage) || 0;
    return Math.min(100, Math.round((page / totalPages) * 100));
  };

  const progress = getProgressPercentage();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Library</span>
      </button>

      {/* Book Header Card */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800">
        <CardContent className="p-6">
          <div className="flex gap-5">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <div className="w-28 h-40 rounded-xl overflow-hidden shadow-2xl bg-white/10">
                {book?.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-white/50" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between text-white">
              <div>
                <h1 className="text-xl font-serif font-bold leading-tight mb-2 line-clamp-2">
                  {book?.title || 'Unknown Title'}
                </h1>
                <p className="text-emerald-100 text-sm line-clamp-1">
                  {book?.author || 'Unknown Author'}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-100">Progress</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-100">
                  Page {progressPage || 0} of {totalPages || '?'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Progress Section */}
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-6 space-y-6">
          {/* Page Progress */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-700">Current Page</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                max={totalPages || undefined}
                value={progressPage}
                onChange={(e) => setProgressPage(e.target.value)}
                className="flex-1 h-12 text-lg font-medium border-stone-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20"
                placeholder="0"
              />
              <span className="text-stone-500 font-medium">/ {totalPages || '?'}</span>
            </div>
            {/* Quick buttons */}
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((increment) => (
                <Button
                  key={increment}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = Number.parseInt(progressPage) || 0;
                    const newValue = Math.min(current + increment, totalPages || current + increment);
                    setProgressPage(newValue.toString());
                  }}
                  className="flex-1 rounded-lg text-xs"
                >
                  +{increment}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-700">Reading Status</label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                    status === option.value
                      ? option.color
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-700">Your Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-none text-stone-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-stone-500">{rating} of 5</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpdateProgress}
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-lg shadow-emerald-500/25"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Update Progress'
              )}
            </Button>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 w-12 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Remove Book</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove "{book?.title}" from your library? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
