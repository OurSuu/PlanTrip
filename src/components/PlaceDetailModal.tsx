// src/components/PlaceDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import type { Place, Comment } from '../types/place';

// [FINAL CHECK]: Import type Profile ให้ถูกต้อง
import type { Profile } from '../contexts/AuthContext';

// [FINAL FIX]: กำหนด Props ให้ไม่มี profile (ถ้าไม่ได้ใช้) และต้องมี onVote
interface Props {
  place: Place;
  onClose: () => void;
  onVote: (id: string) => void; // <-- [FINAL FIX] ต้องมีบรรทัดนี้
  onDeletePlace: (id: string) => void;
  isViewingTrash: boolean;
  onRestorePlace: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

const modalBgVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.17 } },
};

const PlaceDetailModal: React.FC<Props> = ({
  place,
  onClose,
  onVote,
  onDeletePlace,
  isViewingTrash,
  onRestorePlace,
  onPermanentDelete,
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [showComments, setShowComments] = useState(true); // เปิด Comment เป็น Default
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  // โหลด Comment
  const fetchComments = async () => {
    if (!place.id) return;
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:profiles!comments_author_fkey (
          id, username, avatar_url
        )
      `)
      .eq('place_id', place.id)
      .order('created_at', { ascending: true });
    if (!error && data) setComments(data as Comment[]);
  };

  // ส่ง Comment (column names ต้องตรงกับ schema)
  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setIsSending(true);
    const { error } = await supabase
      .from('comments')
      .insert([
        {
          place_id: place.id,
          author: user?.id,
          text: newComment,
        },
      ]);
    setIsSending(false);
    if (error) {
      showToast('เกิดข้อผิดพลาดในการส่งความคิดเห็น', 'error');
    } else {
      setNewComment('');
      fetchComments();
      showToast('แสดงความคิดเห็นแล้ว', 'success');
    }
  };

  // ลบ Comment
  const handleDeleteComment = async (id: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) {
      showToast('ลบคอมเมนต์ไม่สำเร็จ', 'error');
    } else {
      setComments((prev) => prev.filter((c) => c.id !== id));
      showToast('ลบคอมเมนต์แล้ว', 'success');
    }
  };

  // realtime comments
  useEffect(() => {
    fetchComments();
    // Subscribe realtime if needed
    const commentSub = supabase
      .channel('realtime-comments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `place_id=eq.${place.id}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(commentSub);
    };
    // eslint-disable-next-line
  }, [place.id]);

  // Logic owner: ใช้ addedBy จาก Join (Place join profiles)
  // [FIX]: โปรไฟล์ place.addedBy อาจจะเป็น object หรือ string ให้ fallback
  const ownerProfile =
    typeof place.addedBy === 'object' && place.addedBy !== null
      ? (place.addedBy as { username?: string; avatar_url?: string })
      : undefined;
  const ownerName = ownerProfile?.username || 'เจ้าของ';
  const ownerAvatar = ownerProfile?.avatar_url;

  // Logic การหาว่าโหวตแล้วหรือไม่ (ใช้ user.id)
  const voteCount = place.voters?.length || 0;
  const hasVoted = place.voters?.includes?.(user?.id ?? '');

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-[55] bg-black/50 backdrop-blur-sm p-4"
        variants={modalBgVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose} // เมื่อคลิก Backdrop ให้ปิด Modal
      >
        <motion.div
          className="bg-white max-w-xl w-full rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 100 }}
          onClick={(e) => e.stopPropagation()} // ป้องกันการปิดเมื่อคลิกภายใน Card
        >
          {/* 1. รูปภาพใหญ่ */}
          <img
            src={place.imageUrl || 'default.png'}
            alt={place.name}
            className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg"
          />

          {/* 2. รายละเอียด */}
          <h2 className="text-3xl font-bold text-gray-800">{place.name}</h2>
          <p className="mt-2 text-gray-700">{place.description || 'ไม่มีคำอธิบาย'}</p>
          <p className="text-xl font-semibold mt-2 text-indigo-700">
            ~{place.cost?.toLocaleString()} บาท
          </p>
          <div className="flex items-center mt-3 gap-2">
            {ownerAvatar && (
              <img
                src={ownerAvatar}
                className="w-8 h-8 rounded-full"
                alt={ownerName}
              />
            )}
            <span className="text-gray-500 text-sm">โดย {ownerName}</span>
          </div>

          {/* 3. ปุ่ม Action (Vote, Trash Action) */}
          <div className="flex justify-between items-center mt-4 border-t pt-4">
            {/* ปุ่ม Vote */}
            <button
              onClick={() => onVote(place.id)}
              disabled={!user}
              className={`px-4 py-2 rounded-full shadow-md focus:ring-2 ${
                hasVoted ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
              } transition-colors`}
            >
              ❤️ {voteCount} โหวต
            </button>

            {/* ปุ่มจัดการถังขยะ */}
            {isViewingTrash ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onRestorePlace(place.id)}
                  className="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200"
                >
                  ♻️ กู้คืน
                </button>
                <button
                  onClick={() => onPermanentDelete(place.id)}
                  className="px-3 py-2 rounded-lg bg-red-100 text-red-700 font-medium hover:bg-red-200"
                >
                  ลบถาวร
                </button>
              </div>
            ) : (
              <button
                onClick={() => onDeletePlace(place.id)}
                className="text-red-500 hover:text-red-700 px-3 py-2 rounded-lg"
              >
                🗑️ ลบ
              </button>
            )}
          </div>

          {/* 4. ส่วน Comment */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">ความคิดเห็น</h3>
              <button
                className="text-indigo-500 text-sm"
                onClick={() => setShowComments((s) => !s)}
              >
                {showComments ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
            {showComments && (
              <div>
                <div className="mb-3 flex flex-col gap-2 max-h-52 overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="text-gray-400 text-sm">ยังไม่มีความคิดเห็น</div>
                  ) : (
                    comments.map((comment) => {
                      // [FIX]: ใช้ comment.profiles จากการ Join และระบุ type ให้ถูกต้อง
                      const authorProfile =
                        (comment.profiles as {
                          username?: string;
                          id: string;
                          avatar_url?: string;
                        }) || undefined;
                      return (
                        <div
                          key={comment.id}
                          className="flex items-start gap-2 bg-gray-50 p-2 rounded-md group relative"
                        >
                          {/* [FIX]: ใช้ authorProfile ที่ Join มา */}
                          <span className="font-medium text-gray-700 flex-shrink-0">
                            {authorProfile?.username || 'ผู้ใช้'}
                          </span>
                          <span className="text-gray-800 text-sm">
                            {comment.text}
                          </span>
                          {/* [FIX]: ใช้ comment.author สำหรับ check สิทธิ์ (author เป็น id) */}
                          {comment.author === user?.id && (
                            <button
                              type="button"
                              title="ลบ"
                              className="ml-auto text-xs text-red-400 opacity-0 group-hover:opacity-100 transition"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              ลบ
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={200}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                    placeholder="เขียนความคิดเห็น..."
                  />
                  <button
                    onClick={handleSendComment}
                    className="bg-indigo-500 hover:bg-indigo-600 px-4 text-white rounded-lg font-medium disabled:opacity-50"
                    disabled={isSending || !newComment.trim()}
                  >
                    ส่ง
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-gray-200 rounded-lg font-medium"
          >
            ปิดรายละเอียด
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlaceDetailModal;