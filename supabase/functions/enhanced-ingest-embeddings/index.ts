// supabase/functions/enhanced-ingest-embeddings/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// Load env vars
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// ---- Gemini embedding helper ----
async function embedText(text: string): Promise<number[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text }]
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.embedding.values;
    
    // Log the dimensions for debugging
    console.log(`📊 Embedding dimensions: ${embedding.length}`);
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// ---- Enhanced chunking strategy ----
function chunkRow(table: string, row: any): Array<{source_id: number, chunk_index: number, chunk: string, metadata: any}> {
  switch(table) {
    case "companies":
      return [
        {
          source_id: row.company_id,
          chunk_index: 0,
          chunk: `Company: ${row.name}\nIndustry: ${row.industry}\nCreated: ${new Date(row.created_at).toLocaleDateString()}\nCompany ID: ${row.company_id}`,
          metadata: { 
            type: 'company',
            name: row.name,
            industry: row.industry,
            company_id: row.company_id
          }
        }
      ];

    case "contacts":
      return [
        {
          source_id: row.contact_id,
          chunk_index: 0,
          chunk: `Contact: ${row.fullname || 'Unknown'}\nEmail: ${row.email || 'N/A'}\nPhone: ${row.phone || 'N/A'}\nAddress: ${row.address || 'N/A'}\nCompany ID: ${row.company_id || 'N/A'}\nContact ID: ${row.contact_id}`,
          metadata: { 
            type: 'contact',
            name: row.fullname,
            email: row.email,
            contact_id: row.contact_id,
            company_id: row.company_id
          }
        }
      ];

    case "profiles":
      return [
        {
          source_id: row.profile_id,
          chunk_index: 0,
          chunk: `Team Member: ${row.fullname}\nRole: ${row.role}\nEmail: ${row.email}\nPhone: ${row.phone || 'N/A'}\nCompany ID: ${row.company_id}\nProfile ID: ${row.profile_id}`,
          metadata: { 
            type: 'profile',
            name: row.fullname,
            role: row.role,
            profile_id: row.profile_id,
            company_id: row.company_id
          }
        }
      ];

    case "products":
      return [
        {
          source_id: row.product_id,
          chunk_index: 0,
          chunk: `Product: ${row.name || 'Unnamed Product'}\nDescription: ${row.description || 'No description available'}\nCreated: ${new Date(row.created_at).toLocaleDateString()}\nProduct ID: ${row.product_id}`,
          metadata: { 
            type: 'product',
            name: row.name,
            product_id: row.product_id,
            created_by: row.created_by
          }
        }
      ];

    case "deals":
      return [
        {
          source_id: row.deal_id,
          chunk_index: 0,
          chunk: `Deal: ${row.title || 'Untitled Deal'}\nValue: $${row.value || 0}\nStage: ${row.stage}\nProbability: ${row.probability || 0}%\nContact ID: ${row.contact_id}\nProduct ID: ${row.product_id}\nDeal ID: ${row.deal_id}`,
          metadata: { 
            type: 'deal',
            title: row.title,
            value: row.value,
            stage: row.stage,
            deal_id: row.deal_id,
            contact_id: row.contact_id,
            product_id: row.product_id
          }
        }
      ];

    case "interactions":
      return [
        {
          source_id: row.interaction_id,
          chunk_index: 0,
          chunk: `Customer Interaction: ${row.type || 'Unknown Type'}\nNote: ${row.note || 'No notes'}\nContact ID: ${row.contact_id}\nProduct ID: ${row.product_id || 'N/A'}\nDate: ${new Date(row.created_at).toLocaleDateString()}\nInteraction ID: ${row.interaction_id}`,
          metadata: { 
            type: 'interaction',
            interaction_type: row.type,
            interaction_id: row.interaction_id,
            contact_id: row.contact_id,
            product_id: row.product_id,
            profile_id: row.profile_id
          }
        }
      ];

    case "tasks":
      return [
        {
          source_id: row.task_id,
          chunk_index: 0,
          chunk: `Task: ${row.title}\nDescription: ${row.description || 'No description'}\nPriority: ${row.priority}\nStatus: ${row.status}\nType: ${row.type}\nDue Date: ${row.due_date || 'No due date'}\nAssigned to Profile ID: ${row.assigned_to}\nTask ID: ${row.task_id}`,
          metadata: { 
            type: 'task',
            title: row.title,
            priority: row.priority,
            status: row.status,
            task_type: row.type,
            task_id: row.task_id,
            assigned_to: row.assigned_to,
            deal_id: row.deal_id,
            contact_id: row.contact_id
          }
        }
      ];

    case "messages":
      // Messages can be long → chunk them by ~500 chars
      const chunks = [];
      const text = row.content || "";
      const chunkSize = 500;
      
      if (text.length <= chunkSize) {
        chunks.push({
          source_id: row.message_id,
          chunk_index: 0,
          chunk: `Team Message in Room ID ${row.room_id} by Profile ID ${row.sender_id}:\n${text}`,
          metadata: { 
            type: 'message',
            message_id: row.message_id,
            room_id: row.room_id,
            sender_id: row.sender_id
          }
        });
      } else {
        for (let i = 0; i < text.length; i += chunkSize) {
          chunks.push({
            source_id: row.message_id,
            chunk_index: Math.floor(i / chunkSize),
            chunk: `Team Message (part ${Math.floor(i / chunkSize) + 1}) in Room ID ${row.room_id} by Profile ID ${row.sender_id}:\n${text.slice(i, i + chunkSize)}`,
            metadata: { 
              type: 'message',
              message_id: row.message_id,
              room_id: row.room_id,
              sender_id: row.sender_id,
              chunk_part: Math.floor(i / chunkSize) + 1
            }
          });
        }
      }
      return chunks;

    default:
      return [];
  }
}

// ---- Clear existing embeddings for a table ----
async function clearTableEmbeddings(table: string) {
  console.log(`🗑️ Clearing existing embeddings for ${table}...`);
  const { error } = await supabase
    .from("embeddings")
    .delete()
    .eq("source_table", table);
  
  if (error) {
    console.error(`❌ Failed to clear ${table} embeddings:`, error);
    throw error;
  }
  console.log(`✅ Cleared ${table} embeddings`);
}

// ---- Ingest one table with enhanced error handling and batching ----
async function ingestTable(table: string) {
  console.log(`🔄 Ingesting ${table}...`);
  
  try {
    // Clear existing embeddings for this table
    await clearTableEmbeddings(table);

    // Get all rows from the table
    const { data: rows, error } = await supabase.from(table).select("*");
    if (error) throw error;

    if (!rows || rows.length === 0) {
      console.log(`⚠️ No data found in ${table}`);
      return;
    }

    console.log(`📊 Processing ${rows.length} rows from ${table}`);

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          const chunks = chunkRow(table, row);
          
          for (const chunk of chunks) {
            const embedding = await embedText(chunk.chunk);
            
            const { error: insertError } = await supabase
              .from("embeddings")
              .insert({
                source_table: table,
                source_id: chunk.source_id,
                chunk_index: chunk.chunk_index,
                content: chunk.chunk,
                metadata: chunk.metadata,
                embedding: embedding
              });
            
            if (insertError) {
              console.error(`❌ Failed to insert ${table}:${chunk.source_id}:${chunk.chunk_index}`, insertError);
            } else {
              console.log(`✅ Inserted ${table}:${chunk.source_id}:${chunk.chunk_index}`);
            }
          }
        } catch (rowError) {
          console.error(`❌ Failed to process ${table} row:`, row, rowError);
          // Continue with next row instead of failing completely
        }
      }
      
      // Brief delay between batches to respect rate limits
      if (i + batchSize < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }
    
    console.log(`✅ Finished ingesting ${table}`);
    
  } catch (error) {
    console.error(`❌ Failed to ingest ${table}:`, error);
    throw error;
  }
}

// ---- Main handler ----
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const tables = url.searchParams.get("tables")?.split(",") || [
    "companies",
    "contacts", 
    "profiles",
    "products",
    "deals",
    "interactions",
    "tasks",
    "messages"
  ];

  console.log(`🚀 Starting embedding ingestion for tables: ${tables.join(", ")}`);

  try {
    for (const table of tables) {
      await ingestTable(table.trim());
    }
    
    const response = {
      success: true,
      message: "Embeddings updated successfully!",
      tables_processed: tables,
      timestamp: new Date().toISOString()
    };
    
    console.log("✅ All embeddings updated successfully!");
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("❌ Embedding ingestion failed:", error);
    
    const errorResponse = {
      success: false,
      error: String(error),
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});