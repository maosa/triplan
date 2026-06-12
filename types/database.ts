export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type WorkoutType = 'Swim' | 'Bike' | 'Run' | 'Strength' | 'Rest' | 'Other'

export type MaintenanceDefaults = Record<string, { am: WorkoutType | null; pm: WorkoutType | null }>

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
                    landing_page: 'races' | 'maintenance' | 'results'
                    maintenance_defaults: MaintenanceDefaults
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    units?: 'metric' | 'imperial'
                    theme?: 'light' | 'dark'
                    landing_page?: 'races' | 'maintenance' | 'results'
                    maintenance_defaults?: MaintenanceDefaults
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    units?: 'metric' | 'imperial'
                    theme?: 'light' | 'dark'
                    landing_page?: 'races' | 'maintenance' | 'results'
                    maintenance_defaults?: MaintenanceDefaults
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
                    type: WorkoutType
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
                    type: WorkoutType
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
                    type?: WorkoutType
                    duration?: string | null
                    distance?: number | null
                    intensity?: number | null
                    details?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            maintenance_entries: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    session: 'AM' | 'PM'
                    type: WorkoutType
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date: string
                    session: 'AM' | 'PM'
                    type: WorkoutType
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    session?: 'AM' | 'PM'
                    type?: WorkoutType
                    created_at?: string
                    updated_at?: string
                }
            }
            race_results: {
                Row: {
                    race_id: string
                    user_id: string
                    swim_distance: number | null
                    swim_time_seconds: number | null
                    swim_pace_seconds: number | null
                    t1_time_seconds: number | null
                    bike_distance: number | null
                    bike_elevation: number | null
                    bike_time_seconds: number | null
                    bike_speed: number | null
                    t2_time_seconds: number | null
                    run_distance: number | null
                    run_time_seconds: number | null
                    run_pace_seconds: number | null
                    total_time_seconds: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    race_id: string
                    user_id: string
                    swim_distance?: number | null
                    swim_time_seconds?: number | null
                    swim_pace_seconds?: number | null
                    t1_time_seconds?: number | null
                    bike_distance?: number | null
                    bike_elevation?: number | null
                    bike_time_seconds?: number | null
                    bike_speed?: number | null
                    t2_time_seconds?: number | null
                    run_distance?: number | null
                    run_time_seconds?: number | null
                    run_pace_seconds?: number | null
                    total_time_seconds?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    race_id?: string
                    user_id?: string
                    swim_distance?: number | null
                    swim_time_seconds?: number | null
                    swim_pace_seconds?: number | null
                    t1_time_seconds?: number | null
                    bike_distance?: number | null
                    bike_elevation?: number | null
                    bike_time_seconds?: number | null
                    bike_speed?: number | null
                    t2_time_seconds?: number | null
                    run_distance?: number | null
                    run_time_seconds?: number | null
                    run_pace_seconds?: number | null
                    total_time_seconds?: number | null
                    created_at?: string
                    updated_at?: string
                }
            }
            security_events: {
                Row: {
                    id: string
                    user_id: string | null
                    event_type: string
                    metadata: Record<string, unknown>
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    event_type: string
                    metadata?: Record<string, unknown>
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string
                }
                // Audit log is append-only — updates are never permitted.
                // Using `never` causes a compile-time error on any .update() call.
                Update: never
            }
        }
    }
}
