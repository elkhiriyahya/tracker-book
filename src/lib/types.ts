// Database types for Supabase
export type BookStatus = 'want_to_read' | 'reading' | 'finished' | 'dropped';

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface Book {
  id: string; // Google Books ID
  title: string;
  author: string;
  cover_url: string | null;
  total_pages: number | null;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: BookStatus;
  progress_page: number;
  rating: number | null;
  books?: Book;
  created_at?: string;
}

// Google Books API response types
export interface GoogleBookVolumeInfo {
  title: string;
  authors?: string[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  pageCount?: number;
  description?: string;
  publishedDate?: string;
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: GoogleBookVolumeInfo;
}

export interface GoogleBooksResponse {
  items?: GoogleBookItem[];
  totalItems: number;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id'> & { id?: string };
        Update: Partial<Profile>;
      };
      books: {
        Row: Book;
        Insert: Book;
        Update: Partial<Book>;
      };
      user_books: {
        Row: UserBook;
        Insert: Omit<UserBook, 'id'> & { id?: string };
        Update: Partial<Omit<UserBook, 'id' | 'user_id' | 'book_id'>>;
      };
    };
  };
}
