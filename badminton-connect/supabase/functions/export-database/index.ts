import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const tables = [
  'shop_categories',
  'products',
  'courts',
  'profiles',
  'user_roles',
  'experience_rules',
  'posts',
  'post_likes',
  'notifications',
  'direct_messages',
  'partner_requests',
  'partner_request_participants',
  'challenges',
  'matches',
  'orders',
  'order_items',
  'cart',
  'favorites',
  'penalty_logs',
];

function escapeMySQL(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

function generateMySQLInsert(tableName: string, rows: any[]): string {
  if (!rows || rows.length === 0) return `-- No data in table: ${tableName}\n`;
  
  const columns = Object.keys(rows[0]);
  const columnList = columns.map(c => `\`${c}\``).join(', ');
  
  let sql = `-- Table: ${tableName}\n`;
  sql += `-- Records: ${rows.length}\n`;
  
  for (const row of rows) {
    const values = columns.map(col => escapeMySQL(row[col])).join(', ');
    sql += `INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});\n`;
  }
  
  return sql + '\n';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting database export...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let sqlOutput = `-- Database Export from Lovable Cloud\n`;
    sqlOutput += `-- Generated: ${new Date().toISOString()}\n`;
    sqlOutput += `-- MySQL Compatible Format\n\n`;
    sqlOutput += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    
    for (const tableName of tables) {
      console.log(`Exporting table: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        console.error(`Error fetching ${tableName}:`, error.message);
        sqlOutput += `-- Error exporting ${tableName}: ${error.message}\n\n`;
        continue;
      }
      
      sqlOutput += generateMySQLInsert(tableName, data || []);
    }
    
    sqlOutput += `SET FOREIGN_KEY_CHECKS=1;\n`;
    
    console.log('Export completed successfully');
    
    return new Response(sqlOutput, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="database_export_${new Date().toISOString().split('T')[0]}.sql"`,
      },
    });
  } catch (error: unknown) {
    console.error('Export error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
