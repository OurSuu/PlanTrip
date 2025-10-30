// src/components/AddPlaceModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onAddPlace?: (data: any) => void;
  onClose: () => void;
}

// ลด animation ให้เบา ลื่นขึ้น
const modalBgVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.11, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.09, ease: "easeIn" }
  },
};

const cardVariants: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 15 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: "easeOut",
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: { duration: 0.13, ease: "easeIn" }
  }
};

const labelStyle = "block font-semibold text-[1rem] tracking-wide mb-1 text-cyan-900/95 drop-shadow-[0_2px_8px_rgba(150,230,241,0.2)]";
const inputStyle = "mt-1 p-2 w-full rounded-xl bg-white/90 focus:bg-white/95 border border-cyan-200 focus:border-cyan-400 outline-none shadow-cyan-100/20 shadow text-[#26334f] transition-all duration-200";
const lightButton = "px-4 py-2 rounded-xl font-bold bg-gray-100/90 hover:bg-cyan-50 text-cyan-700 border border-cyan-100 shadow transition-all";
const saveButton = "px-4 py-2 rounded-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-400/80 to-sky-600 text-white shadow-lg border-0 hover:scale-[1.02] transition-all duration-150";

const AddPlaceModal: React.FC<Props> = ({ onAddPlace, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cost, setCost] = useState<number | ''>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const { showToast } = useToast();

  const { profile } = useAuth();

  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  // ---- Supabase Upload & Insert logic ---- //

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    // The 'cost' field should be int8, so must be integer >= 1
    const costNumber = typeof cost === 'number' ? cost : Number(cost);
    if (!name || !costNumber || costNumber < 1 || isNaN(costNumber) || !Number.isInteger(costNumber)) {
      showToast("⚠️ กรุณาใส่ชื่อและค่าใช้จ่ายที่มากกว่า 0", 'warning');
      return;
    }
    if (!profile?.id) {
      showToast("กรุณาเข้าสู่ระบบก่อนเพิ่มสถานที่", 'error');
      return;
    }

    setIsSaving(true);

    let imageUrl: string | null = null;
    let uploadError: string | null = null;

    // 1. ถ้ามี imageFile ให้ upload ขึ้น storage ก่อน
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `places/${profile.id}_${Date.now()}.${fileExt}`;

      // Changed: use the new bucket name "place_images"
      const { error: uploadErr } = await supabase.storage
        .from('place_images')
        .upload(filePath, imageFile, {
          upsert: true,
        });

      if (uploadErr) {
        uploadError = `อัปโหลดรูปภาพล้มเหลว: ${uploadErr.message}`;
      } else {
        // get public URL
        const { data } = supabase.storage.from('place_images').getPublicUrl(filePath);
        imageUrl = data?.publicUrl || null;
      }
    }

    if (uploadError) {
      showToast(uploadError, 'error');
      setIsSaving(false);
      return;
    }

    // 2. Insert new place to supabase
    const insertData: any = {
      name,
      description,
      cost: costNumber,
      addedBy: profile?.id,
      imageUrl,
    };

    // Use .select().single() to get new row with generated id and proper related fields
    const { data: insertedData, error: insertErr } = await supabase
      .from('place') // <--- แก้ไขตรงนี้จาก 'places' เป็น 'place'
      .insert([insertData])
      .select()
      .single();

    if (insertErr) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + insertErr.message, 'error');
      setIsSaving(false);
      return;
    }

    showToast('บันทึกสถานที่ใหม่สำเร็จ! 🎉', 'success');

    // (optional) inform parent component with full row with id
    onAddPlace?.(insertedData);

    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 250); // ลดเวลารอเพื่อความเร็ว
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-[55]"
        variants={modalBgVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          background: "linear-gradient(135deg, rgba(19,28,54,0.44) 52%,rgba(98,202,242,0.11) 100%)",
          backdropFilter: "blur(3px) brightness(0.97)"
        }}
      >
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          // ตัด animation เวลา hover เพื่อช่วยประหยัด resource
          style={{
            background: "linear-gradient(143deg,rgba(255,255,255,0.88) 89%,rgba(144,245,255,0.25) 100%)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px 0 rgba(70,210,255,0.09), 0 3px 10px rgba(40,174,255,0.08)",
            border: "1.5px solid rgba(80,196,242,0.13)",
            borderRadius: 22,
            width: "100%",
            maxWidth: 420,
            padding: 32,
            overflow: "visible",
            position: "relative"
          }}
        >
          {/* Accent Header with Floating Icon */}
          <div className="flex flex-col items-center mb-3 relative">
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-7 rounded-full bg-gradient-to-tr from-cyan-200 to-sky-100/80 p-3 border border-cyan-100 shadow"
              style={{ zIndex: 1, transition: 'box-shadow 0.15s, transform 0.12s' }}
            >
              {/* Icon: no animation */}
              <span className="text-3xl drop-shadow">🏞️</span>
            </div>
            <h2 className="mt-7 text-2xl md:text-2.5xl font-black text-sky-700 bg-gradient-to-r from-cyan-500/90 via-sky-600/80 to-violet-400 bg-clip-text text-transparent drop-shadow-lg tracking-tight text-center">เพิ่มสถานที่เที่ยวใหม่</h2>
            <p className="text-xs mt-1 text-sky-700/80 font-light">อย่าลืมกรอกข้อมูลให้ครบถ้วนนะ!</p>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off" className="mt-1">
            <div className="mb-4">
              <label className={labelStyle}>
                ชื่อสถานที่
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputStyle + " font-semibold text-lg"}
                required
                placeholder="เช่น ตลาดน้ำ, ถนนคนเดิน"
                maxLength={36}
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className={labelStyle}>รายละเอียด <span className="font-light text-gray-400 ml-1">(ไม่บังคับ)</span></label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={inputStyle + " font-medium"}
                placeholder="รายละเอียดโดยย่อ"
                maxLength={68}
              />
            </div>
            <div className="mb-4">
              <label className={labelStyle}>
                รูปภาพสถานที่
                <span className="font-light text-gray-500 ml-1">(ไม่จำเป็น)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={inputStyle + " cursor-pointer"}
              />
              <AnimatePresence>
                {imagePreviewUrl && (
                  <motion.div
                    className="mt-2 p-1 border border-sky-200 rounded-lg flex flex-col items-center gap-1 bg-cyan-50/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.11 } }}
                    exit={{ opacity: 0, transition: { duration: 0.09, ease: "easeIn" as any } }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-36 object-cover rounded-lg shadow-lg border border-cyan-100"
                      style={{ transition: 'filter .15s', filter: imageFile ? undefined : "blur(1px) grayscale(0.45)" }}
                    />
                    <p className="text-xs text-gray-600/90 mt-1 font-medium">รูปภาพที่เลือก</p>
                    <button
                      type="button"
                      className="mt-2 px-2.5 py-1 text-xs bg-cyan-100/70 text-cyan-800 border border-cyan-200 rounded-lg font-semibold hover:bg-sky-50 transition-all"
                      onClick={handleRemoveImage}
                    >
                      เอารูปภาพออก
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mb-2">
              <label className={labelStyle}>
                ค่าใช้จ่าย (โดยประมาณ)
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={cost}
                  onChange={e => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className={inputStyle + " pr-12 font-semibold"}
                  required
                  min={1}
                  placeholder="เช่น 150"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-cyan-600 text-sm font-medium pointer-events-none select-none">บาท</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 sm:gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className={lightButton}
                style={{
                  boxShadow: "0 1.5px 9px rgba(12,158,179,0.11)"
                }}
                disabled={isSaving}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className={saveButton + (isSaving ? " opacity-80 cursor-not-allowed pointer-events-none" : "")}
                style={{
                  boxShadow: "0 2px 18px rgba(50,210,241,0.13)"
                }}
                disabled={isSaving}
              >
                <span className="inline-flex gap-1 items-center">
                  <span>
                    {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                  </span>
                  <span className="ml-1 text-xl inline-block">💾</span>
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddPlaceModal;