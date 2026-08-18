import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvzhlttvyqhlcdstftr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnpobHR0dnlxaGxjZHN0ZnRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwMzAxMzEsImV4cCI6MjEwMjYwNjEzMX0.bu2XW4sDrubcJ1tJEuTBk0wupTOw6kZQpaRe0XR6VKo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)