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
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    first_name: string | null
                    last_name: string | null
                    units: 'metric' | 'imperial'
                    theme: 'light' | 'dark'
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    units?: 'metric' | 'imperial'
                    theme?: 'light' | 'dark'
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    units?: 'metric' | 'imperial'
                    theme?: 'light' | 'dark'
                    created_at?: string
                }
            }
            races: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    location: string | null
                    date: string
                    details: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    name: string
                    location?: string | null
                    date: string
                    details?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    location?: string | null
                    date?: string
                    details?: string | null
                    created_at?: string
                }
            }
            workouts: {
                Row: {
                    id: string
                    race_id: string
                    user_id: string
                    date: string
                    type: 'Swim' | 'Bike' | 'Run' | 'Strength' | 'Rest' | 'Stretching' | 'Other'
                    duration: string | null
                    distance: number | null
                    intensity: number | null
                    details: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    race_id: string
                    user_id: string
                    date: string
                    type: 'Swim' | 'Bike' | 'Run' | 'Strength' | 'Rest' | 'Stretching' | 'Other'
                    duration?: string | null
                    distance?: number | null
                    intensity?: number | null
                    details?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    race_id?: string
                    user_id?: string
                    date?: string
                    type?: 'Swim' | 'Bike' | 'Run' | 'Strength' | 'Rest' | 'Stretching' | 'Other'
                    duration?: string | null
                    distance?: number | null
                    intensity?: number | null
                    details?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
