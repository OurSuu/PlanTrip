// src/types/place.ts
import type { Profile } from '../contexts/AuthContext'; // 1. Import พิมพ์เขียว Profile

// 2. พิมพ์เขียว Place ใหม่
// สังเกตว่า addedBy (uuid) ถูกแทนที่ด้วย profiles (Object)
// และ voters เป็น array ของ string (uuid)
export interface Place {
  id: string;
  created_at: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  addedBy: string; // <-- นี่คือ uuid ของคนสร้าง
  voters: string[]; // <-- นี่คือ array ของ uuid
  
  // [ใหม่!] นี่คือข้อมูล "ที่ห้อยมาด้วย" (JOIN)
  profiles: Profile | null; 
}

// 3. พิมพ์เขียว Comment ใหม่
// สังเกตว่า author (uuid) ถูกแทนที่ด้วย profiles (Object)
export interface Comment {
  id: string;
  created_at: string;
  text: string;
  author: string; // <-- นี่คือ uuid ของคนเขียน
  place_id: string; //

  // [ใหม่!] ข้อมูล "ที่ห้อยมาด้วย" (JOIN)
  profiles: Profile | null;
}

// 4. พิมพ์เขียวสำหรับ "สร้าง" สถานที่
// (เราจะส่งแค่ uuid, ไม่ได้ส่ง Object profile)
export type NewPlaceData = Omit<Place, 'id' | 'created_at' | 'voters' | 'profiles'>;