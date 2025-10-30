import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassLayout from '../components/GlassLayout';

const PROFILE_VIDEO_URL = "/videos/test3.mp4";

const ProfilePage: React.FC = () => {
  const { user, profile, logout, refetchProfile } = useAuth();
  const navigate = useNavigate();

  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile || !user) return;
    setUploading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData) throw new Error('Could not get public URL');
      const new_url = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: new_url })
        .eq('id', user.id);

      if (!updateError) {
        refetchProfile();
        setSuccessMsg('✅ อัปเดตโปรไฟล์สำเร็จ!');
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        throw updateError;
      }
    } catch (error: any) {
      setErrorMsg(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setSuccessMsg(null), 2500);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login'; 
  };

  if (!profile || !user) {
    return (
      <GlassLayout videoUrl={PROFILE_VIDEO_URL}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <motion.div
            className="p-8 md:p-12 bg-gradient-to-tr from-[#dfcff857] via-[#bad8ff66] to-[#fce4fb37] rounded-2xl shadow-xl ring-1 ring-[#7ad1e166]"
            initial={{ opacity: 0, y: 42, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: "anticipate" }}
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-sky-600">
              <span className="animate-spin">🚄</span> 
              กำลังโหลดโปรไฟล์...
            </div>
          </motion.div>
        </div>
      </GlassLayout>
    );
  }

  const displayAvatar = avatarPreview || profile.avatar_url || 'https://via.placeholder.com/150';

  return (
    <GlassLayout videoUrl={PROFILE_VIDEO_URL}>
      <div className="relative min-h-screen flex items-center justify-center z-10">
        {/* Background subtle blobs */}
        <AnimatePresence>
          <motion.div
            className="absolute -top-36 -left-36 w-[450px] h-[370px] rounded-full blur-[95px] z-0"
            style={{ background: "radial-gradient(circle at 60% 30%, #6ee7fbaa 0%, #f0abfc88 100%)" }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 0.72, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 1.6, delay: 0.1 }}
          />
          <motion.div
            className="absolute bottom-5 right-8 w-[260px] h-[180px] rounded-full blur-[80px] z-0"
            style={{ background: "radial-gradient(circle at 40% 70%, #fde68a88 0%, #c4b5fd88 100%)" }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 0.54, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 1.7, delay: 0.2 }}
          />
        </AnimatePresence>
        <motion.div
          className="w-full max-w-md z-10"
          initial={{ y: 42, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.72, type: "spring" }}
        >
          <div
            className="relative bg-white/20 dark:bg-[#27282f]/80 rounded-3xl shadow-2xl ring-2 ring-cyan-200/40
              px-7 py-8 md:py-10 flex flex-col items-center"
            style={{
              backdropFilter: "blur(23px)",
              WebkitBackdropFilter: "blur(23px)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18, type: 'spring', stiffness: 170 }}
            >
              <div className="relative flex flex-col items-center mb-7">
                <motion.img
                  src={displayAvatar}
                  alt="Avatar"
                  className="w-36 h-36 rounded-full shadow-xl border-4 border-cyan-100/60 bg-white object-cover ring-2 ring-cyan-200"
                  initial={{ scale: 0.89, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 140, delay: 0.10 }}
                />
                {avatarFile &&
                  <motion.span
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold bg-cyan-600/80 text-white animate-pulse"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    Preview
                  </motion.span>
                }
              </div>
              <motion.h2
                className="text-[1.8rem] font-bold bg-gradient-to-r from-sky-600 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent text-center flex items-center justify-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13 }}
              >
                👋 {profile.username}
              </motion.h2>
              <motion.div
                className="mt-1 text-xs text-slate-700/80 font-medium text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.19 }}
              >
                {user.email}
              </motion.div>
            </motion.div>

            {/* messages */}
            <div className="w-full mt-4 min-h-[26px] mb-2">
              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    key="success"
                    className="text-center text-sm px-3 py-2 rounded-lg font-medium bg-green-100 text-green-700 shadow border border-green-200"
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  >
                    {successMsg}
                  </motion.div>
                )}
                {errorMsg && (
                  <motion.div
                    key="error"
                    className="text-center text-sm px-3 py-2 rounded-lg font-medium bg-red-100 text-red-700 shadow border border-red-200"
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* upload form */}
            <div className="w-full mb-5">
              <label
                htmlFor="avatar-upload"
                className="block text-[15px] font-semibold mb-1 text-cyan-700"
              >
                อัปเดตรูปโปรไฟล์
              </label>
              <div className="relative flex items-center w-full gap-2">
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileSelected}
                  className="flex-1 block text-sm bg-white/75 border border-cyan-300 rounded-full px-3 py-2 file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-cyan-100 file:text-cyan-800
                  hover:file:bg-cyan-200 outline-none transition ring-1 ring-cyan-100/30 focus:ring-2 focus:ring-cyan-300/60"
                  disabled={uploading}
                />
                {avatarFile && (
                  <motion.button
                    onClick={handleUploadAvatar}
                    disabled={uploading}
                    className={`px-3 py-2 rounded-full font-semibold
                    bg-gradient-to-tr from-cyan-400 to-cyan-600 text-white shadow-md
                    hover:from-cyan-300 hover:to-cyan-500 hover:scale-105 transition-all
                    disabled:bg-gray-300 disabled:text-gray-800 disabled:cursor-not-allowed disabled:opacity-70
                    `}
                    whileHover={(!uploading) ? { scale: 1.07 } : {}}
                    whileTap={(!uploading) ? { scale: 0.98 } : {}}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {uploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="#fff" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        กำลังอัปโหลด...
                      </span>
                    ) : (
                      <span>ยืนยัน</span>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            <motion.hr
              className="w-full border-t border-cyan-300/20 my-8"
              initial={{ scaleX: 0.26, opacity: 0.2 }}
              animate={{ scaleX: 1, opacity: 0.6 }}
              transition={{ delay: 0.3, duration: 0.50, type: "tween" }}
            />

            {/* Logout & Back */}
            <div className="w-full flex flex-col gap-3">
              <motion.button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1 px-4 py-3 rounded-full font-bold tracking-tight
                  bg-gradient-to-r from-pink-600 via-red-500 to-orange-400 text-white text-base shadow-lg
                  hover:from-pink-500 hover:to-orange-300 hover:scale-[1.03] transition-all duration-200
                  active:scale-[0.97]"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.11 }}
              >
                <span className="text-lg">🚪</span>
                <span>ออกจากระบบ</span>
              </motion.button>

              <motion.button
                onClick={() => navigate('/plan')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full font-medium border border-cyan-300/30 bg-white/50
                text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900 active:bg-cyan-100 transition-all duration-200 text-base shadow"
                whileHover={{ scale: 1.04, backgroundColor: '#d1faff' }}
                whileTap={{ scale: 0.97 }}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <span className="text-lg">←</span>
                <span>กลับไปหน้า PlanTrip</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </GlassLayout>
  );
};

export default ProfilePage;