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
  review?: string | null;
  updated_at?: string;
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

// Database schema type strictly following Supabase GenericSchema structure
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          author: string | null
          cover_url: string | null
          created_at: string
          id: string
          title: string
          total_pages: number | null
        }
        Insert: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          id: string
          title: string
          total_pages?: number | null
        }
        Update: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          title?: string
          total_pages?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_books: {
        Row: {
          book_id: string
          id: string
          progress_page: number | null
          rating: number | null
          review: string | null
          status: Database["public"]["Enums"]["reading_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          id?: string
          progress_page?: number | null
          rating?: number | null
          review?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          id?: string
          progress_page?: number | null
          rating?: number | null
          review?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      reading_status: "want_to_read" | "reading" | "finished" | "dropped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
