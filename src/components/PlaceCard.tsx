// src/components/PlaceCard.tsx
import React, { useState, useEffect } from 'react';
// 1. Import พิมพ์เขียวใหม่
import type { Place, Comment } from '../types/place';
import type { Profile } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient'; 
import { useAuth } from '../contexts/AuthContext'; 
import { useToast } from '../contexts/ToastContext'; // <--- เพิ่ม Import

// 2. [อัปเกรด!] Props
interface Props {
  place: Place;         // (Place ก้อนใหม่ ที่มี profiles ห้อย)
  profile: Profile;     // (Profile ของ "เรา")
  onVote: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onDeletePlace: (id: string) => void;
  // --- [สำหรับโหมดถังขยะ] ---
  isViewingTrash: boolean; // <--- เพิ่ม
  onRestorePlace: (id: string) => void; // <--- เพิ่ม
  onPermanentDelete: (id: string) => void; // <--- เพิ่ม
}

const PlaceCard: React.FC<Props> = ({
  place,
  profile,
  onVote,
  onSelect,
  isSelected,
  onDeletePlace,
  isViewingTrash, // <--- ใหม่
  onRestorePlace, // <--- ใหม่
  onPermanentDelete, // <--- ใหม่
}) => {
  const { showToast } = useToast(); // <--- เรียกใช้ Hook

  // --- [อัปเกรด!] ส่วนจัดการโหวต/เลือก ---
  const voteCount = place.voters?.length || 0;
  // เช็กด้วย profile.id (uuid) แทน nickname
  const hasVoted = place.voters?.includes(profile.id);

  // ปุ่ม style (เติมของดีฟอลต์)
  const voteButtonClass = hasVoted
    ? "px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
    : "px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors";
  const selectButtonClass = isSelected
    ? "px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
    : "px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors";

  // --- [อัปเกรด!] ส่วนคอมเมนต์ ---
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // ----------- [ใหม่] Modal สำหรับกู้คืน ----------- 
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const handleConfirmRestore = () => {
    onRestorePlace(place.id);
    setShowRestoreModal(false);
  };
  // -----------------------------------------------

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles ( id, username, avatar_url )
      `)
      .eq('place_id', place.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data as Comment[]);
    }
    setLoadingComments(false);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === '') return;

    const { error } = await supabase.from('comments').insert([
      {
        place_id: place.id,
        author: profile.id,
        text: newComment,
      },
    ]);

    if (error) {
      console.error('Error sending comment:', error);
      showToast("🚨 ส่งคอมเมนต์ไม่สำเร็จ", 'error'); // แจ้ง Error
    } else {
      setNewComment('');
      showToast("✅ ส่งคอมเมนต์สำเร็จ", 'success'); // แจ้งสำเร็จ
      // Realtime (ด้านล่าง) จะอัปเดต UI ให้
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    // ใช้ window.confirm ชั่วคราว (ถ้าต้องการ UI ต้องปรับปรุงโค้ดอย่างมาก)
    if (window.confirm('คุณแน่ใจนะว่าจะลบคอมเมนต์นี้?')) { 
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        showToast("🚨 ลบคอมเมนต์ไม่สำเร็จ", 'error'); // แจ้ง Error
      } else {
        setComments(currentComments =>
          currentComments.filter(comment => comment.id !== commentId)
        );
        showToast("🗑️ ลบคอมเมนต์สำเร็จ", 'success'); // แจ้งสำเร็จ
      }
    }
  };

  useEffect(() => {
    if (!showComments) return;

    fetchComments();

    const channel = supabase
      .channel(`comments-for-${place.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `place_id=eq.${place.id}`,
        },
        (_payload) => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showComments, place.id]);

  // ตรวจสอบว่าเราเป็นเจ้าของหรือไม่
  const isOwner = place.addedBy === profile.id;

  // ตรวจและแสดงชื่อและรูปโปรไฟล์ของเจ้าของ Card
  let ownerName = '';
  let ownerAvatar = '';
  // *** แก้ไขการตรวจสอบ: ใช้ place.addedBy แทน place.profiles ***
  if (place.addedBy && typeof place.addedBy === 'object') {
    // ตรวจสอบว่า place.addedBy มีข้อมูลจริงหรือไม่ (ถ้าถูกดึงมา)
    const creatorProfile = place.addedBy as { username: string, avatar_url: string | null };

    ownerName = creatorProfile.username
      ? String(creatorProfile.username)
      : 'ไม่ทราบชื่อ';

    ownerAvatar = creatorProfile.avatar_url && typeof creatorProfile.avatar_url === 'string'
      ? creatorProfile.avatar_url
      : 'https://i.imgur.com/G5iE1G3.png';
  } else {
    ownerName = 'ไม่ทราบชื่อ';
    ownerAvatar = 'https://i.imgur.com/G5iE1G3.png';
  }

  return (
    <div
      className={`
        relative border-2 rounded-xl shadow-xl overflow-hidden
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
      {/* ปุ่มลบสถานที่ (ซ่อนเมื่ออยู่ในโหมดถังขยะ) */}
      {!isViewingTrash && (
        <button
          onClick={() => onDeletePlace(place.id)}
          className="absolute top-2 right-2 z-10 p-1 bg-red-500/90 text-white rounded-full 
                       hover:bg-red-700 w-6 h-6 flex items-center justify-center text-xs shadow-md shadow-red-300"
          title="ลบสถานที่นี้"
        >
          🗑️
        </button>
      )}

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
          ~{place.cost.toLocaleString()} บาท
        </p>
        <div className="flex justify-between items-center mt-4">
          {/* [อัปเกรด]: แสดงปุ่มตามโหมดถังขยะ */}
          {isViewingTrash ? (
            // 🗑️ โหมดถังขยะ: แสดงปุ่มกู้คืนและลบถาวร
            <>
              <button
                onClick={() => setShowRestoreModal(true)} // <--- ใหม่: เปิด Modal
                className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md focus:ring-2 focus:ring-green-200"
              >
                ♻️ กู้คืน
              </button>
              <button
                onClick={() => onPermanentDelete(place.id)} // <--- ปุ่มลบถาวรใหม่
                className="px-4 py-2 bg-red-800 text-white rounded-full hover:bg-red-900 transition-colors shadow-md focus:ring-2 focus:ring-red-300"
              >
                ลบถาวร 💀
              </button>
              {/* Modal กู้คืน */}
              {showRestoreModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-xs w-full">
                    <h4 className="text-lg font-bold mb-2">ยืนยันการกู้คืน</h4>
                    <p className="mb-4 text-gray-600 dark:text-gray-300">คุณแน่ใจหรือไม่ว่าต้องการกู้คืนสถานที่นี้?</p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowRestoreModal(false)}
                        className="px-4 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleConfirmRestore}
                        className="px-4 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                      >
                        ยืนยัน
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // โหมดปกติ: แสดงปุ่มโหวตและเลือก (โค้ดเดิม)
            <>
              <button
                onClick={() => onVote(place.id)}
                className={`${voteButtonClass} shadow-md focus:ring-2 focus:ring-red-200`}
              >
                ❤️ {voteCount} โหวต
              </button>
              <button
                onClick={() => onSelect(place.id)}
                className={`${selectButtonClass} shadow-md focus:ring-2 focus:ring-blue-200`}
              >
                {isSelected ? '✅ เลือกแล้ว' : '🛒 เลือก'}
              </button>
            </>
          )}
        </div>
        {/* แสดงชื่อเเละรูปผู้สร้าง Card โดยไม่บัค */}
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

      {/* --- [อัปเกรด!] ส่วนแสดง Comment --- */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-slate-800/50 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          {showComments ? 'ซ่อนคอมเมนต์' : `แสดงคอมเมนต์`}
        </button>

        {showComments && (
          <div className="mt-4">
            {loadingComments && <p className="text-xs text-gray-500">กำลังโหลด...</p>}
            <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
              {comments.map(comment => {
                const authorProfile = comment.profiles;
                const isCommentOwner = comment.author === profile.id;

                let commentAuthorName = '';
                let commentAuthorAvatar = '';
                if (authorProfile && typeof authorProfile === 'object') {
                  commentAuthorName = authorProfile.username
                    ? String(authorProfile.username)
                    : '...';
                  commentAuthorAvatar = authorProfile.avatar_url && typeof authorProfile.avatar_url === 'string'
                    ? authorProfile.avatar_url
                    : 'https://i.imgur.com/G5iE1G3.png';
                } else {
                  commentAuthorName = '...';
                  commentAuthorAvatar = 'https://i.imgur.com/G5iE1G3.png';
                }

                return (
                  <div
                    key={comment.id}
                    className="text-sm bg-white/70 dark:bg-slate-800/80 p-2 rounded
                    flex justify-between items-center group shadow-sm
                    backdrop-blur-md transition-all"
                  >
                    <div className="flex items-center">
                      <img 
                        src={commentAuthorAvatar}
                        alt={commentAuthorName}
                        className="w-6 h-6 rounded-full mr-2 object-cover ring-1 ring-gray-200 shadow bg-white"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://i.imgur.com/G5iE1G3.png';
                        }}
                      />
                      <div className="truncate max-w-[120px]" title={commentAuthorName}>
                        <strong>{commentAuthorName}:</strong> {comment.text}
                      </div>
                    </div>
                    {isCommentOwner && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 font-bold ml-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="ลบ"
                      >
                        X
                      </button>
                    )}
                  </div>
                );
              })}
              {comments.length === 0 && !loadingComments && (
                <p className="text-xs text-gray-500">ยังไม่มีคอมเมนต์</p>
              )}
            </div>
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="แสดงความคิดเห็น..."
                className="flex-1 p-2 border rounded-md text-sm bg-white/70 dark:bg-slate-800/50 backdrop-blur-md"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 shadow"
              >
                ส่ง
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCard;