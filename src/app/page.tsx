// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserBook } from '@/lib/types';
// 1. UPDATED THESE IMPORTS TO MATCH YOUR EXACT LOWERCASE FILENAMES
import Auth from '@/Components/Auth';
import HomeScreen from '@/Components/HomeScreen';
import SearchScreen from '@/Components/SearchScreen';
import BookDetailScreen from '@/Components/BookDetailScreen';

import { Button } from '@/Components/ui/button';
import { Toaster } from '@/Components/ui/sonner';
import { BookOpen, Search, User, LogOut } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Screen = 'home' | 'search' | 'book-detail';

export default function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Demo mode - skip auth check if no credentials configured
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co';

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, create a fake user
      setUser({ id: 'demo-user-123', email: 'demo@example.com' } as SupabaseUser);
      setLoading(false);
      return;
    }

    // Check current session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const handleSignOut = async () => {
    if (isDemoMode) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleAuthSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const handleSelectBook = (userBook: UserBook) => {
    setSelectedBook(userBook);
    setCurrentScreen('book-detail');
  };

  const handleBookUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBackFromDetail = () => {
    setSelectedBook(null);
    setCurrentScreen('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-emerald-50/30 to-stone-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25 mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onAuthSuccess={handleAuthSuccess} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/20 to-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-200/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/25">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-serif font-bold text-stone-800">PageTracker</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 rounded-lg">
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-xs text-stone-600 font-medium max-w-[100px] truncate">
                {user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-8 w-8 p-0 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {currentScreen === 'home' && (
          <HomeScreen
            userId={user.id}
            onSelectBook={handleSelectBook}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentScreen === 'search' && (
          <SearchScreen userId={user.id} onBookAdded={handleBookUpdate} />
        )}

        {currentScreen === 'book-detail' && selectedBook && (
          <BookDetailScreen
            userBook={selectedBook}
            onBack={handleBackFromDetail}
            onUpdate={handleBookUpdate}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {currentScreen !== 'book-detail' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-stone-200/50 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-2">
            <div className="flex items-center justify-around">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
                  currentScreen === 'home'
                    ? 'text-emerald-600'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    currentScreen === 'home' ? 'bg-emerald-100' : ''
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Library</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen('search')}
                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
                  currentScreen === 'search'
                    ? 'text-emerald-600'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    currentScreen === 'search' ? 'bg-emerald-100' : ''
                  }`}
                >
                  <Search className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Discover</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}