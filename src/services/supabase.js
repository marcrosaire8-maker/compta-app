import { createClient } from '@supabase/supabase-js'

// On met les valeurs en dur pour éviter les problèmes de variables d'environnement sur Render
const supabaseUrl = 'https://txekzbjuraganndyowqn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4ZWt6Ymp1cmFnYW5uZHlvd3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjAwMTEsImV4cCI6MjA3OTMzNjAxMX0.h-ou28IDhlPnocoBZ4gOx1RFb79oWAviO8QdnYyQfaU'

export const supabase = createClient(supabaseUrl, supabaseKey)
