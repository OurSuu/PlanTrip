
import { createClient } from '@supabase/supabase-js'

// 1. เอา URL และ Key ของคุณจาก (Project Settings > API) มาใส่
const supabaseUrl = 'https://awwqvqhykandexohmxso.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d3F2cWh5a2FuZGV4b2hteHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDA4MzgsImV4cCI6MjA3NzMxNjgzOH0.pdrK5YG8hakhpwqZThNCQPxE8A09XiyThGWJFW28ERc'

// 2. สร้างและ export client
// เราจะใช้ 'supabase' นี้ในไฟล์อื่นๆ เพื่อคุยกับฐานข้อมูล
export const supabase = createClient(supabaseUrl, supabaseKey)