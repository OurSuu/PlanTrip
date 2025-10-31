import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import AddPlaceModal from "../components/AddPlaceModal";
import PlaceCard from "../components/PlaceCard";
import PlaceDetailModal from "../components/PlaceDetailModal";
import { useAuth } from "../contexts/AuthContext"; // FIX: Remove unused Profile import
import { useToast } from "../contexts/ToastContext";
import type { Place } from "../types/place";
import GlassLayout from "../components/GlassLayout";
import { supabase } from "../supabaseClient";

const PLANPAGE_VIDEO_URL = "/videos/test2.mp4";

function useScrollFades(threshold = 120) {
  const [fadeTop, setFadeTop] = useState(1);
  useEffect(() => {
    const update = () => {
      const s = window.scrollY || document.documentElement.scrollTop;
      setFadeTop(1 - Math.min(s / threshold, 1) * 0.21);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return { fadeTop };
}

const PlanPage: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();

  useToast();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewingTrash, setIsViewingTrash] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const handleOpenDetails = (id: string) => {
    setSelectedPlaceId(id);
  };
  const handleCloseDetails = () => {
    setSelectedPlaceId(null);
  };

  const { fadeTop } = useScrollFades(120);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('place')
        .select(`*, addedBy:profiles!place_addedBy_fkey (id, username, avatar_url)`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching places:', error);
      } else {
        setPlaces((data as Place[]) || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('places_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'place' },
        () => {
          fetchData();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleVote = async (id: string) => {
    if (!user?.id) return;

    const placeToUpdate = places.find(p => p.id === id);
    if (!placeToUpdate) return;

    const hasVoted = placeToUpdate.voters?.includes(user.id);
    const newVoters = hasVoted
      ? placeToUpdate.voters.filter(voterId => voterId !== user.id)
      : [...(placeToUpdate.voters || []), user.id];

    const { error } = await supabase
      .from('place')
      .update({ voters: newVoters })
      .eq('id', id);

    if (error) {
      console.error("Vote failed:", error);
      return;
    }

    setPlaces(prevPlaces =>
      prevPlaces.map(p =>
        p.id === id ? { ...p, voters: newVoters } : p
      )
    );
  };

  const handleDeletePlace = (_id: string, ..._args: any[]) => {};
  const handleRestorePlace = (_id: string, ..._args: any[]) => {};
  const handlePermanentDelete = (_id: string, ..._args: any[]) => {};

  const handleAddPlace = (newPlaceData: any) => {
    if (newPlaceData && profile) {
      const placeWithProfile: Place = {
        ...newPlaceData,
        addedBy: profile,
        voters: [],
      };
      setPlaces(prev => [placeWithProfile, ...prev]);
    }
  };

  if (authLoading || loading) {
    return (
      <GlassLayout videoUrl={PLANPAGE_VIDEO_URL}>
        <div className="relative w-full min-h-screen pt-16 pb-20 max-w-7xl mx-auto">
          <div className="w-full h-[80vh] flex items-center justify-center">
            <motion.div
              className="flex flex-col items-center bg-gradient-to-t from-[#ba96ff22] to-[#fdcbbf22] px-12 py-10 rounded-xl shadow-2xl ring-1 ring-[#fff5] border border-yellow-200/10"
              initial={{ opacity: 0.7, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1.01 }}
              transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
            >
              <span className="flex items-center gap-3 text-xl mb-1 font-bold tracking-tight text-[#3c3040] drop-shadow-lg">🚆 กำลังตรวจสอบตารางรถไฟ...</span>
              <span className="animate-pulse text-[#776e79] text-xs">รอสักครู่...</span>
            </motion.div>
          </div>
        </div>
      </GlassLayout>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  if (!profile) {
    return (
      <GlassLayout videoUrl={PLANPAGE_VIDEO_URL}>
        <div className="relative w-full min-h-screen pt-16 pb-20 max-w-7xl mx-auto text-[#332034]">
          <div className="w-full h-[90vh] flex items-center justify-center">
            <motion.div className="max-w-xl mx-auto py-10 px-7 bg-gradient-to-tr from-[#fdeccd] via-[#f4b39f48] to-[#bda2f426] rounded-2xl shadow-[0_8px_32px_0px_rgba(245,216,138,0.12)] text-center ring-1 ring-[#997a5a18]">
              <motion.h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-purple-700 bg-clip-text text-transparent">
                โปรไฟล์ไม่สมบูรณ์
              </motion.h1>
              <p className="mt-3 text-sm md:text-base opacity-90 text-[#3c3042]">
                บัญชีของคุณลงทะเบียนสำเร็จ แต่ยังไม่มีข้อมูลโปรไฟล์
              </p>
            </motion.div>
          </div>
        </div>
      </GlassLayout>
    );
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem",
    perspective: 900,
  };

  return (
    <GlassLayout videoUrl={PLANPAGE_VIDEO_URL}>
      <div className="relative w-full min-h-screen pt-16 pb-20 max-w-7xl mx-auto overflow-x-hidden text-[#2e2236] font-inter">

        {/* --- เลเยอร์แสงเย็นๆ/เงา --- */}
        <div
          className="pointer-events-none fixed top-0 left-0 w-full h-10 z-[13] blur-[2.5px]"
          style={{
            background:
              "linear-gradient(90deg, #ffd5a700 7%, #b599e4 70%, #ffe6c40f 100%)",
            opacity: 0.88,
          }}
        />
        <div
          style={{
            pointerEvents: "none",
            position: "fixed",
            left: 0,
            right: 0,
            height: 80,
            top: 0,
            zIndex: 12,
            opacity: 1 - fadeTop,
            background: "linear-gradient(180deg, #e5b57aee 0%, transparent 98%)",
            transition: "opacity 0.3s",
          }}
        />

        {/* Navbar */}
        <Navbar profile={profile} />

        <AnimatePresence>
          <motion.section
            className="relative px-2 sm:px-4 md:px-8 lg:px-12 pt-24 pb-36 flex flex-col items-center max-w-[105rem] mx-auto"
            initial={{ opacity: 0.87 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.81 }}
          >

            {/* Toggle */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10 z-[2]">
              <motion.button
                onClick={() => setIsViewingTrash(false)}
                whileHover={{ scale: 1.03 }}
                className={
                  `py-3 px-7 rounded-2xl text-lg font-semibold transition-all border-b-2 shadow-lg shadow-yellow-200/15 ring-1 ${
                    !isViewingTrash
                      ? "bg-gradient-to-br from-yellow-200/80 to-indigo-300/80 text-[#3e220b] shadow-xl ring-[#ffe49e40] border-yellow-300"
                      : "bg-[#e5d6df12] text-[#38233e] ring-yellow-100/10 border-transparent hover:shadow-md"
                  }`
                }
                style={{
                  boxShadow: !isViewingTrash
                    ? "0 2px 32px #efbd6744"
                    : "",
                  fontFamily: "Quicksand,sans-serif"
                }}
              >
                <span className="flex items-center gap-2">🚏 <span>สถานี - สถานที่</span></span>
              </motion.button>
              <motion.button
                onClick={() => setIsViewingTrash(true)}
                whileHover={{ scale: 1.03 }}
                className={
                  `py-3 px-7 rounded-2xl text-lg font-semibold transition-all border-b-2 shadow-lg shadow-[#945c8a17] ring-1 ${
                    isViewingTrash
                      ? "bg-gradient-to-br from-[#f7d5f7ca] to-[#a197fae0] text-[#4b2044] shadow-xl ring-white/10 border-fuchsia-200"
                      : "bg-[#e5d6df12] text-[#473148] ring-white/5 border-transparent hover:shadow-md"
                  }`
                }
                style={{
                  boxShadow: isViewingTrash
                    ? "0 2px 32px #c387ce33"
                    : "",
                  fontFamily: "Quicksand,sans-serif"
                }}
              >
                <span className="flex items-center gap-2">🗑️ <span>ถังขยะ</span></span>
              </motion.button>
            </div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0.6, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, type: "spring", stiffness: 60 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[3rem] font-extrabold text-center mb-8"
              style={{
                color: "#231627",
                background: undefined,
                WebkitBackgroundClip: undefined,
                WebkitTextFillColor: undefined,
                backgroundClip: undefined,
                letterSpacing: "-0.01em",
                textShadow: "0 8px 32px #eddcb430, 0 1.5px 8px #c9b7ed12"
              }}
            >
              ตารางเดินทางด้วยรถไฟของเรา
            </motion.h1>

            {/* Add button */}
            {!isViewingTrash && (
              <motion.button
                onClick={() => setIsModalOpen(true)}
                whileHover={{
                  scale: 1.045,
                  background: "linear-gradient(90deg,#fbefc8 85%,#b58dfa 100%)",
                  boxShadow: "0 5px 24px 0 #ffe49e44",
                }}
                whileTap={{ scale: 0.97 }}
                className="mb-10 bg-gradient-to-r from-yellow-100 via-indigo-100 to-sky-100 text-[#402e4d] font-extrabold tracking-wide py-3 px-12 rounded-2xl shadow-xl border border-yellow-100/50"
                style={{ boxShadow: "0 4px 22px #ffecd344, 0 2px 0 #e8b97824" }}
              >
                <span className="flex items-center font-bold gap-2 text-lg">
                  <span className="inline-block text-[#fbb24d] text-2xl">＋</span>
                  เพิ่มสถานี / จุดแลนด์มาร์ค
                </span>
              </motion.button>
            )}

            {/* Cards grid */}
            <div
              className="w-full max-w-7xl z-20"
              style={gridStyle}
            >
              {places.length > 0 ? (
                places.map((place, idx) => {
                  return (
                    <motion.div
                      key={place.id}
                      className="w-full"
                      initial={{ opacity: 0.5, y: 16 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        boxShadow:
                          "0 3px 15px rgba(189,178,255,0.13),0 1.5px 4px 0 #e6af4d22",
                      }}
                      whileHover={{
                        scale: 1.012,
                        z: 30,
                        boxShadow:
                          "0 11px 28px 0px #efd79f38,0 2px 6px 0 #c1adff10",
                        borderColor: "#efd299"
                      }}
                      transition={{ duration: 0.22, delay: idx * 0.017 }}
                      viewport={{ once: false, amount: 0.15 }}
                      style={{
                        transformStyle: "preserve-3d",
                        willChange: "transform,box-shadow,border-color",
                        borderRadius: 15,
                        border: "1.2px solid #fff6",
                        maxWidth: 340,
                        width: "100%",
                        margin: "0 auto"
                      }}
                    >
                      <PlaceCard
                        place={place}
                        profile={profile} // <--- [FINAL CHECK] ต้องมีบรรทัดนี้!
                        onVote={handleVote}
                        onOpenDetails={handleOpenDetails}
                        isViewingTrash={isViewingTrash}
                      />
                    </motion.div>
                  );
                })
              ) : (
                <motion.p
                  className="text-center py-16 text-lg sm:text-2xl font-bold rounded-xl bg-gradient-to-t from-[#ffefc91d] to-[#bfb7fe0f] drop-shadow-xl"
                  initial={{ opacity: 0.56 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7 }}
                  style={{ fontFamily: "Quicksand,sans-serif", color: "#2e1f17" }}
                >
                  {isViewingTrash
                    ? "⛔️ ไม่มีจุดแวะรถไฟในถังขยะ"
                    : "🚂 ยังไม่มีสถานี — เริ่มแอดสถานีหรือจุดหมายแรกเลย!"}
                </motion.p>
              )}
            </div>
          </motion.section>
        </AnimatePresence>

        {/* [NEW!] Modal รายละเอียด (ต้องอยู่ล่างสุด) */}
        <AnimatePresence>
          {selectedPlaceId && (
            <PlaceDetailModal
              place={places.find(p => p.id === selectedPlaceId) as Place}
              profile={profile}
              onClose={handleCloseDetails}
              onVote={handleVote}
              onDeletePlace={handleDeletePlace}
              onRestorePlace={handleRestorePlace}
              onPermanentDelete={handlePermanentDelete}
              isViewingTrash={isViewingTrash}
            />
          )}
        </AnimatePresence>

        {/* Add modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-[1.5px]"
              style={{ background: "rgba(131,110,178,0.05)" }}
            >
              <motion.div
                initial={{ scale: 0.96, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.97, y: 4 }}
                transition={{ type: "spring", stiffness: 135 }}
                className="max-w-3xl w-full mx-4"
              >
                <AddPlaceModal onClose={() => setIsModalOpen(false)} onAddPlace={handleAddPlace} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassLayout>
  );
};

export default PlanPage;
