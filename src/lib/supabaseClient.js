/*
'https://bzialvmbemezfrwiqhrd.supabase.co'
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6aWFsdm1iZW1lemZyd2lxaHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDQ1MzEsImV4cCI6MjA4NjM4MDUzMX0.3w1mpFzAr4IvUTrlF1GdXOhjOU6g5lsjK5w8KcYyGGc'
*/

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddnsjziajgznrzewaqig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbnNqemlhamd6bnJ6ZXdhcWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzgxNTIsImV4cCI6MjA4NTg1NDE1Mn0.imyogslEUn_PPAgr9dtaaCbsFczfaD_K3QNL3OO6Ctc';
export const supabase = createClient(supabaseUrl, supabaseKey);


