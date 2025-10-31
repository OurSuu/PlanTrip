// src/components/PlaceCard.tsx
import React from 'react';
import type { Place } from '../types/place';
import type { Profile } from '../contexts/AuthContext';

// ปรับ Interface Props (ไม่มี logic/props ปุ่ม Vote/Trash/Comment อีก)
interface Props {
  place: Place;
  profile: Profile;
  onOpenDetails: (id: string) => void; // <-- Prop เปิด Modal
  isSelected: boolean;
  isViewingTrash: boolean;
}

const PlaceCard: React.FC<Props> = ({
  place,
  profile,
  onOpenDetails,
  isSelected,
  isViewingTrash,
}) => {
  // Validate place object
  if (!place || !place.id || !place.name) {
    return null;
  }

  // ป้องกัน null/undefined owner profile หรือ addedBy
  let ownerName = '';
  let ownerAvatar = '';
  if (
    place.addedBy &&
    typeof place.addedBy === 'object' &&
    (place.addedBy as any)?.username
  ) {
    const creatorProfile = place.addedBy as { username: string; avatar_url: string | null };
    ownerName = String(creatorProfile.username);
    ownerAvatar = (creatorProfile.avatar_url && typeof creatorProfile.avatar_url === 'string')
      ? creatorProfile.avatar_url
      : 'https://i.imgur.com/G5iE1G3.png';
  } else {
    ownerName = 'ไม่ทราบชื่อ';
    ownerAvatar = 'https://i.imgur.com/G5iE1G3.png';
  }

  return (
    <div
      onClick={() => onOpenDetails(place.id)} // เมื่อคลิก Card จะเปิด Modal
      className={`
        relative border-2 rounded-xl shadow-xl overflow-hidden cursor-pointer
        bg-white/40 dark:bg-slate-900/70
        ${isSelected ? 'border-blue-500' : 'border-transparent'}
        transition-all
        backdrop-blur-md
        hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03]
        duration-200
        shadow-blue-200/40
        [&:hover]:shadow-blue-400/60
        group
      `}
      style={{
        boxShadow: '0 8px 32px 0 rgba(30,45,120,0.09), 0 2px 4px 0 rgba(0,0,0,0.03)',
      }}
    >
      {/* ส่วนแสดงข้อมูล */}
      <img
        src={place.imageUrl || 'https://i.imgur.com/YtH4Y9Z.png'}
        alt={place.name}
        className="w-full h-48 object-cover transition-all duration-150 group-hover:scale-105 group-hover:brightness-105"
        style={{ boxShadow: '0 2px 12px 0 rgba(60,110,255,0.10)' }}
      />
      <div className="p-4">
        <h3 className="text-lg font-bold drop-shadow-sm text-black/80 dark:text-white/90">{place.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 h-10 overflow-hidden">{place.description}</p>
        <p className="font-semibold text-lg mt-2 text-indigo-700 dark:text-indigo-400 drop-shadow">
          {typeof place.cost === 'number' ? <>~{place.cost.toLocaleString()} บาท</> : null}
        </p>
        {/* ลบปุ่ม Vote, ปุ่ม Select, ปุ่มลบ/ถังขยะแล้ว ไม่เหลือ action แสดงเพียงข้อมูล */}
        <div className="flex justify-between items-center mt-4">
          {/* ไม่มีปุ่มอื่นใดที่เกี่ยวกับ Vote/Select/Trash */}
        </div>
        {/* ส่วนแสดงชื่อและรูปผู้สร้าง */}
        <div className="text-xs text-gray-400 mt-3 block text-right flex justify-end items-center gap-1.5">
          <span className="text-gray-400 truncate max-w-[88px]" title={ownerName}>
            โดย: {ownerName}
          </span>
          <img
            src={ownerAvatar}
            alt={ownerName}
            className="w-6 h-6 rounded-full ml-1 object-cover ring-1 ring-gray-700 shadow-lg bg-white"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://i.imgur.com/G5iE1G3.png';
            }}
          />
        </div>
      </div>
      {/* ไม่มีส่วน comment */}
    </div>
  );
};

export default PlaceCard;