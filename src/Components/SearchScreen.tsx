'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GoogleBookItem, GoogleBooksResponse } from '@/lib/types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent } from '@/Components/ui/card';
import { Skeleton } from '@/Components/ui/skeleton';
import { toast } from 'sonner';
import { Search, BookOpen, Plus, Check, Loader2, Sparkles } from 'lucide-react';

interface SearchScreenProps {
  userId: string;
  onBookAdded: () => void;
}

export default function SearchScreen({ userId, onBookAdded }: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingBook, setAddingBook] = useState<string | null>(null);
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set());

  const searchBooks = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`
      );
      const data: GoogleBooksResponse = await response.json();

      if (data.items) {
        setResults(data.items);
      } else {
        setResults([]);
        toast.info('No books found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (book: GoogleBookItem) => {
    setAddingBook(book.id);

    const { title, authors, imageLinks, pageCount } = book.volumeInfo;
    const coverUrl = imageLinks?.thumbnail?.replace('http://', 'https://') || null;
    const author = authors?.join(', ') || 'Unknown Author';

    try {
      // First: Upsert the book details into the books table
      const { error: bookError } = await supabase.from('books').upsert(
        {
          id: book.id,
          title: title || 'Untitled',
          author,
          cover_url: coverUrl,
          total_pages: pageCount || null,
        },
        { onConflict: 'id' }
      );

      if (bookError) {
        console.error('Book upsert error:', bookError);
        toast.error('Failed to add book. Please try again.');
        return;
      }

      // Second: Insert a row into the user_books table
      const { error: userBookError } = await supabase.from('user_books').insert({
        user_id: userId,
        book_id: book.id,
        status: 'want_to_read',
        progress_page: 0,
      });

      if (userBookError) {
        // Check if book already exists in user's library
        if (userBookError.code === '23505') {
          toast.info('This book is already in your library!');
          setAddedBooks((prev) => new Set(prev).add(book.id));
        } else {
          console.error('User book insert error:', userBookError);
          toast.error('Failed to add book to library. Please try again.');
        }
        return;
      }

      setAddedBooks((prev) => new Set(prev).add(book.id));
      toast.success(`"${title}" added to your library!`);
      onBookAdded();
    } catch (err) {
      console.error('Error adding book:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setAddingBook(null);
    }
  };

  const BookResult = ({ book }: { book: GoogleBookItem }) => {
    const { title, authors, imageLinks, pageCount } = book.volumeInfo;
    const coverUrl = imageLinks?.thumbnail?.replace('http://', 'https://');
    const isAdded = addedBooks.has(book.id);
    const isAdding = addingBook === book.id;

    return (
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <div className="w-16 h-24 rounded-lg overflow-hidden shadow-sm bg-gradient-to-br from-stone-100 to-stone-200">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-stone-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-stone-800 line-clamp-2 leading-tight mb-1">
                {title || 'Untitled'}
              </h3>
              <p className="text-sm text-stone-500 line-clamp-1 mb-1">
                {authors?.join(', ') || 'Unknown Author'}
              </p>
              {pageCount && (
                <p className="text-xs text-stone-400">{pageCount} pages</p>
              )}
            </div>

            {/* Add Button */}
            <div className="flex-shrink-0 self-center">
              <Button
                size="sm"
                onClick={() => addToLibrary(book)}
                disabled={isAdding || isAdded}
                className={`rounded-full w-10 h-10 p-0 transition-all duration-300 ${
                  isAdded
                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-100'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25'
                }`}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isAdded ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-16 h-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-stone-800">Discover Books</h2>
        <p className="text-stone-500">Search millions of books via Google Books</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
            className="pl-10 h-12 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
          />
        </div>
        <Button
          onClick={searchBooks}
          disabled={loading}
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-md shadow-emerald-500/25"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSkeleton />
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            Found {results.length} results for "{query}"
          </p>
          {results.map((book) => (
            <BookResult key={book.id} book={book} />
          ))}
        </div>
      ) : query ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-stone-400" />
          </div>
          <p className="text-stone-500 text-center">No results found. Try a different search.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 text-emerald-600" />
          </div>
          <p className="text-stone-600 font-medium text-center mb-1">Ready to discover?</p>
          <p className="text-stone-500 text-sm text-center">
            Search for your favorite books above
          </p>
        </div>
      )}
    </div>
  );
}
