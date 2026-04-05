'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserBook, BookStatus } from '@/lib/types';
import { Card, CardContent } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Badge } from '@/Components/ui/badge';
import { Skeleton } from '@/Components/ui/skeleton';
import { BookOpen, Clock, CheckCircle, XCircle, Library } from 'lucide-react';

interface HomeScreenProps {
  userId: string;
  onSelectBook: (userBook: UserBook) => void;
  refreshTrigger?: number;
}

const statusConfig: Record<BookStatus, { label: string; icon: React.ReactNode; color: string }> = {
  reading: {
    label: 'Reading',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  want_to_read: {
    label: 'Want to Read',
    icon: <Clock className="w-3.5 h-3.5" />,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  finished: {
    label: 'Finished',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  dropped: {
    label: 'Dropped',
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: 'bg-stone-100 text-stone-600 border-stone-200',
  },
};

export default function HomeScreen({ userId, onSelectBook, refreshTrigger }: HomeScreenProps) {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('reading');

  useEffect(() => {
    const fetchUserBooks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_books')
          .select('id, status, progress_page, rating, books(id, title, author, cover_url, total_pages)')
          .eq('user_id', userId);

        if (error) {
          console.error('Error fetching books:', error);
          return;
        }

        setBooks(data as unknown as UserBook[]);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBooks();
  }, [userId, refreshTrigger]);

  const filterBooks = (status: BookStatus | 'all') => {
    if (status === 'all') return books;
    return books.filter((book) => book.status === status);
  };

  const getProgressPercentage = (book: UserBook) => {
    if (!book.books?.total_pages || book.books.total_pages === 0) return 0;
    return Math.min(100, Math.round((book.progress_page / book.books.total_pages) * 100));
  };

  const BookCard = ({ userBook }: { userBook: UserBook }) => {
    const book = userBook.books;
    if (!book) return null;

    const progress = getProgressPercentage(userBook);
    const status = statusConfig[userBook.status];

    return (
      <Card
        className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white"
        onClick={() => onSelectBook(userBook)}
      >
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Book Cover */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-28 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-stone-100 to-stone-200">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-stone-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <h3 className="font-semibold text-stone-800 line-clamp-2 leading-tight mb-1 group-hover:text-emerald-700 transition-colors">
                  {book.title}
                </h3>
                <p className="text-sm text-stone-500 line-clamp-1">{book.author || 'Unknown author'}</p>
              </div>

              <div className="space-y-2">
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">
                      Page {userBook.progress_page} of {book.total_pages || '?'}
                    </span>
                    <span className="font-medium text-emerald-600">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Status Badge */}
                <Badge variant="outline" className={`${status.color} text-xs font-medium`}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <Library className="w-10 h-10 text-stone-400" />
      </div>
      <p className="text-stone-500 text-center">{message}</p>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-28 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const readingBooks = filterBooks('reading');
  const wantToReadBooks = filterBooks('want_to_read');
  const finishedBooks = filterBooks('finished');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-stone-800">My Library</h2>
        <p className="text-stone-500">
          {books.length} {books.length === 1 ? 'book' : 'books'} in your collection
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-stone-100 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="reading"
            className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Reading ({readingBooks.length})
          </TabsTrigger>
          <TabsTrigger
            value="want_to_read"
            className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Want ({wantToReadBooks.length})
          </TabsTrigger>
          <TabsTrigger
            value="finished"
            className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Done ({finishedBooks.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <TabsContent value="reading" className="mt-0 space-y-4">
                {readingBooks.length === 0 ? (
                  <EmptyState message="No books currently being read. Start reading something!" />
                ) : (
                  readingBooks.map((book) => <BookCard key={book.id} userBook={book} />)
                )}
              </TabsContent>

              <TabsContent value="want_to_read" className="mt-0 space-y-4">
                {wantToReadBooks.length === 0 ? (
                  <EmptyState message="Your reading list is empty. Search for books to add!" />
                ) : (
                  wantToReadBooks.map((book) => <BookCard key={book.id} userBook={book} />)
                )}
              </TabsContent>

              <TabsContent value="finished" className="mt-0 space-y-4">
                {finishedBooks.length === 0 ? (
                  <EmptyState message="No finished books yet. Keep reading!" />
                ) : (
                  finishedBooks.map((book) => <BookCard key={book.id} userBook={book} />)
                )}
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}
