// src/components/AddPlaceModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewPlaceData } from '../types/place';
import { useToast } from '../contexts/ToastContext';

type DataWithFile = Omit<NewPlaceData, 'addedBy' | 'imageUrl'> & { imageFile: File | null };

interface Props {
  onAddPlace: (data: DataWithFile) => void;
  onClose: () => void;
}

// Smooth backdrop with animated gradient
const modalBgVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.22 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.17 },
  },
};

// Card entrance animates with elevation, fade, and blur pop
const cardVariants = {
  initial: { opacity: 0, scale: 0.94, y: 48, filter: "blur(7px)" },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 116,
      damping: 19,
      mass: 0.98
    }
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 36,
    filter: "blur(5px)",
    // CHANGE: use a string for ease, not an array
    transition: { duration: 0.19, ease: "easeInOut" }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNumber = typeof cost === 'number' ? cost : Number(cost);
    if (!name || !costNumber || costNumber <= 0) {
      showToast("⚠️ กรุณาใส่ชื่อและค่าใช้จ่ายที่มากกว่า 0", 'warning');
      return;
    }
    onAddPlace({
      name,
      description,
      imageFile,
      cost: costNumber,
    });
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
          backdropFilter: "blur(4.5px) brightness(0.96)"
        }}
      >
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          whileHover={{
            boxShadow:
              "0 16px 48px 0 rgba(44,180,255,0.15), 0 4px 24px rgba(0,205,255,0.13)",
            translateY: -4, scale: 1.018
          }}
          style={{
            background: "linear-gradient(143deg,rgba(255,255,255,0.88) 89%,rgba(144,245,255,0.25) 100%)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 12px 60px 0 rgba(70,210,255,0.13), 0 6px 20px rgba(40,174,255,0.10)",
            border: "1.5px solid rgba(80,196,242,0.15)",
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
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 -top-7 rounded-full bg-gradient-to-tr from-cyan-200 to-sky-100/80 p-3 border border-cyan-100 shadow"
              initial={{ opacity: 0, y: -4, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.13, type: "spring", stiffness: 230 }}
              style={{ zIndex: 1 }}
            >
              <motion.span
                initial={{ rotate: -12 }}
                animate={{ rotate: 4, transition: { repeat: Infinity, repeatType: "reverse", duration: 2 } }}
                className="text-3xl drop-shadow"
              >
                🏞️
              </motion.span>
            </motion.div>
            <h2 className="mt-7 text-2xl md:text-2.5xl font-black text-sky-700 bg-gradient-to-r from-cyan-500/90 via-sky-600/80 to-violet-400 bg-clip-text text-transparent drop-shadow-lg tracking-tight text-center">เพิ่มสถานที่เที่ยวใหม่</h2>
            <p className="text-xs mt-1 text-sky-700/80 font-light">อย่าลืมกรอกข้อมูลให้ครบถ้วนนะ!</p>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off" className="mt-1">
            <motion.div layout className="mb-4" transition={{ type: "spring", duration: 0.5 }}>
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
            </motion.div>
            <motion.div layout className="mb-4" transition={{ type: "spring", duration: 0.5 }}>
              <label className={labelStyle}>รายละเอียด <span className="font-light text-gray-400 ml-1">(ไม่บังคับ)</span></label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={inputStyle + " font-medium"}
                placeholder="รายละเอียดโดยย่อ"
                maxLength={68}
              />
            </motion.div>
            <motion.div layout className="mb-4" transition={{ type: "spring", duration: 0.5 }}>
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
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10, transition: { duration: 0.15, ease: "easeInOut" } }}
                    layout
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
            </motion.div>
            <motion.div layout className="mb-2" transition={{ type: "spring", duration: 0.5 }}>
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
            </motion.div>
            <motion.div
              className="flex justify-end gap-2 sm:gap-4 mt-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.10 } }}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className={lightButton}
                style={{
                  boxShadow: "0 1.5px 9px rgba(12,158,179,0.11)"
                }}
              >
                ยกเลิก
              </motion.button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                className={saveButton}
                style={{
                  boxShadow: "0 2px 18px rgba(50,210,241,0.13)"
                }}
              >
                <span className="inline-flex gap-1 items-center">
                  <span>บันทึก</span>
                  <span className="ml-1 text-xl inline-block">💾</span>
                </span>
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddPlaceModal;