

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"("user_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;                          -- Variable to store our final JSON result
  today_date DATE := CURRENT_DATE;     -- Store today's date (e.g., '2025-07-06')
  current_user_id UUID := COALESCE(user_id_param, auth.uid()); -- Use param or current user
BEGIN
  -- Build a single JSON object containing all dashboard data
  SELECT json_build_object(
    
    -- SECTION 1: Overall Stats for dashboard home page and dashboard events page
    -- OPTIMIZED: Single query to get all basic counts at once
    'stats', (
      SELECT json_build_object(
        'total_users', COUNT(DISTINCT e.user_id) FILTER (WHERE e.user_id IS NOT NULL),
        'total_events', COUNT(*),
        'events_today', COUNT(*) FILTER (WHERE DATE(e.created_at) = today_date)
      )
      FROM events e
      JOIN projects p ON e.project_id = p.id
      WHERE p.user_id = current_user_id
    ),
    
    -- SECTION 2: Chart Data Stats on dashboard home page
    'last_7_days', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'date', event_date,                           -- The date (e.g., '2025-07-06')
          'name', to_char(event_date, 'Dy'),           -- Day name (e.g., 'Mon', 'Tue')
          'events', total_events,                       -- Number of events that day
          'users', unique_users                         -- Number of unique users that day
        ) ORDER BY event_date
      ), '[]'::json)                                   -- If no data, return empty array []
      FROM (
        -- We need to aggregate from events table filtered by user's projects
        
        -- Get all 7 days of data from events table
        SELECT 
          DATE(e.created_at) as event_date,
          COUNT(*)::bigint as total_events,
          COUNT(DISTINCT e.user_id)::bigint as unique_users
        FROM events e
        JOIN projects p ON e.project_id = p.id
        WHERE DATE(e.created_at) >= today_date - INTERVAL '6 days'
          AND p.user_id = current_user_id
        GROUP BY DATE(e.created_at)
        ORDER BY event_date    -- Sort all 7 days chronologically
      ) last_week
    ),
    
    -- SECTION 3: Event Type Breakdown counts for dashboard events page
    -- OPTIMIZED: Single query to get all event type counts at once
    'event_type_counts', (
      SELECT json_build_object(
        'page_views', COUNT(*) FILTER (WHERE e.event_type = 'page_view'),
        'user_actions', COUNT(*) FILTER (WHERE e.event_type IN ('button_click', 'form_submit')),
        'errors', COUNT(*) FILTER (WHERE e.event_type = 'error'),
        'custom_events', COUNT(*) FILTER (WHERE e.event_type = 'custom'),
        'feature_used', COUNT(*) FILTER (WHERE e.event_type = 'feature_used'),
        'other_events', COUNT(*) FILTER (WHERE e.event_type NOT IN ('page_view', 'button_click', 'form_submit', 'error', 'custom', 'feature_used'))
      )
      FROM events e
      JOIN projects p ON e.project_id = p.id
      WHERE p.user_id = current_user_id
    ),
    
    -- SECTION 4: Recent Events List for dashboard events page
    'recent_events', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'event_type', event_type,
          'event_data', event_data,
          'user_id', user_id,
          'session_id', session_id,
          'created_at', created_at,
          'project_id', project_id,
          'project', json_build_object('name', project_name)
        ) ORDER BY created_at DESC      -- Newest events first
      ), '[]'::json)                    -- If no events, return empty array
      FROM (
        -- Get the 20 most recent events from user's projects with project names
        SELECT e.id, e.event_type, e.event_data, e.user_id, e.session_id, e.created_at, e.project_id, p.name as project_name
        FROM events e
        JOIN projects p ON e.project_id = p.id
        WHERE p.user_id = current_user_id
        ORDER BY e.created_at DESC      -- Newest first
        LIMIT 20                        -- Only get 20 events
      ) recent
    )
    
  ) INTO result;    -- Store the entire JSON object in the result variable
  
  RETURN result;    -- Return the JSON to the client
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_events_for_export"("start_date" "date" DEFAULT NULL::"date", "end_date" "date" DEFAULT NULL::"date", "max_limit" integer DEFAULT 10000, "user_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "event_type" "text", "event_data" "jsonb", "user_id" "text", "session_id" "text", "created_at" timestamp with time zone, "project_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_user_id UUID := COALESCE(user_id_param, auth.uid());
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.event_type,
    e.event_data,
    e.user_id,
    e.session_id,
    e.created_at,
    e.project_id
  FROM events e
  JOIN projects p ON e.project_id = p.id
  WHERE 
    p.user_id = current_user_id AND
    (start_date IS NULL OR DATE(e.created_at) >= start_date) AND
    (end_date IS NULL OR DATE(e.created_at) <= end_date)
  ORDER BY e.created_at DESC
  LIMIT max_limit;
END;
$$;


ALTER FUNCTION "public"."get_events_for_export"("start_date" "date", "end_date" "date", "max_limit" integer, "user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_projects"("user_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
  current_user_id UUID := COALESCE(user_id_param, auth.uid());
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'name', p.name,
      'api_key', p.api_key,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'user_id', p.user_id,
      'event_count', COALESCE(event_counts.count, 0)
    ) ORDER BY p.created_at DESC
  ) INTO result
  FROM projects p
  LEFT JOIN (
    SELECT 
      project_id,
      COUNT(*) as count
    FROM events 
    GROUP BY project_id
  ) event_counts ON p.id = event_counts.project_id
  WHERE p.user_id = current_user_id;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;


ALTER FUNCTION "public"."get_user_projects"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid" DEFAULT "gen_random_uuid"(),
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "user_id" "text",
    "session_id" "text"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "name" "text" NOT NULL,
    "api_key" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "avatar_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'maps to auth.users';



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_api_key_key" UNIQUE ("api_key");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_events_created_at_project" ON "public"."events" USING "btree" ("created_at" DESC, "project_id");



CREATE INDEX "idx_events_project_created_at" ON "public"."events" USING "btree" ("project_id", "created_at" DESC);



CREATE INDEX "idx_events_project_event_type" ON "public"."events" USING "btree" ("project_id", "event_type");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow event creation" ON "public"."events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."projects" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable read access for owners and API lookups" ON "public"."projects" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("api_key" IS NOT NULL)));



CREATE POLICY "Enable update for users based on user_id" ON "public"."projects" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view project events" ON "public"."events" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."events";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_events_for_export"("start_date" "date", "end_date" "date", "max_limit" integer, "user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_events_for_export"("start_date" "date", "end_date" "date", "max_limit" integer, "user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_events_for_export"("start_date" "date", "end_date" "date", "max_limit" integer, "user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_projects"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_projects"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_projects"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
