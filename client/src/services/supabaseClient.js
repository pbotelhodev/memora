import { createClient } from "@supabase/supabase-js";

// Essas chaves você pega no Painel do Supabase (eu te mostro onde abaixo)
const supabaseUrl = "https://lfnwslsspsejjtiarura.supabase.co";
const supabaseKey = "sb_publishable_63ouhk7RRF1qkiNeGVFQ7w_vWEYslR-";

export const supabase = createClient(supabaseUrl, supabaseKey);
