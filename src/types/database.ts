export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          api_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          api_key?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          api_key?: string
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          project_id: string
          event_type: string
          event_data: any
          user_id: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          event_type: string
          event_data?: any
          user_id?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          event_type?: string
          event_data?: any
          user_id?: string | null
          session_id?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}