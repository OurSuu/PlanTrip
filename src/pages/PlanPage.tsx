import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import AddPlaceModal from "../components/AddPlaceModal";
import PlaceCard from "../components/PlaceCard";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { Place, NewPlaceData } from "../types/place";
import GlassLayout from "../components/GlassLayout";

// ======= THEME: รถไฟ สีเย็น ยามเย็น แต่งานเบากว่าเดิม =======
const PLANPAGE_VIDEO_URL = "/videos/test2.mp4"; // ควรมีวิดีโอบรรยากาศสถานีหรือท้องฟ้ายามเย็น

function useWindowSize() {
  const [size, setSize] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    function onResize() {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

function useScrollFades(threshold = 120) {
  const [fadeTop, setFadeTop] = useState(1);
  const [fadeBottom, setFadeBottom] = useState(1);
  useEffect(() => {
    const update = () => {
      const s = window.scrollY || document.documentElement.scrollTop;
      const wh = window.innerHeight || document.documentElement.clientHeight;
      const dh = document.body.scrollHeight || document.documentElement.scrollHeight;
      setFadeTop(1 - Math.min(s / threshold, 1) * 0.21);
      const distBottom = dh - wh - s;
      setFadeBottom(1 - Math.min(Math.max(0, threshold - distBottom) / threshold, 1) * 0.23);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return { fadeTop, fadeBottom };
}

// ===== ลบรถไฟ/animationล่าง-ดวงอาทิตย์-ไฟสถานีออก =====

// -- ลบ TrainSilhouetteSunset และ EveningSunAndStationLights ---

const PlanPage: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const size = useWindowSize();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [isViewingTrash, setIsViewingTrash] = useState(false);

  const { fadeTop, fadeBottom } = useScrollFades(120);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));
      if (!active) return;
      setPlaces([]); // Sample: Replace with API
      setLoading(false);
    }
    fetchData();
    return () => { active = false; };
  }, []);

  const handleVote = (_id: string, _delta: number) => {};
  const handleSelectPlace = (id: string) => {
    setSelectedPlaceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  // แก้ไข: handleDeletePlace ไม่รับ name argument อีกต่อไป
  const handleDeletePlace = (_id: string) => {};
  const handleRestorePlace = (_id: string) => {};
  const handlePermanentDelete = (_id: string) => {};
  const handleAddPlace = (_data: NewPlaceData) => {};

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
    gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))",
    perspective: 900,
  };

  // ============================ UI =============================
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
        {/* <div
          className="pointer-events-none fixed bottom-0 left-0 w-full h-6 z-[13] blur-[1.5px]"
          style={{
            background:
              "linear-gradient(90deg, #c7b2ff05 30%, #ffe7c7 80%, #b599e402 85%)",
            opacity: .75,
          }}
        /> */}
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
        {/* <div
          style={{
            pointerEvents: "none",
            position: "fixed",
            left: 0,
            right: 0,
            height: 80,
            bottom: 0,
            zIndex: 12,
            opacity: 1 - fadeBottom,
            background: "linear-gradient(0deg, #60485e 0%, transparent 86%)",
            transition: "opacity 0.3s",
          }}
        /> */}

        {/* Navbar */}
        <Navbar profile={profile} />

        {/* animation ด้านล่าง, รถไฟ, ดวงอาทิตย์, โคมไฟสถานีถูกลบออก */}

        <AnimatePresence>
          <motion.section
            className="relative px-2 sm:px-8 lg:px-16 pt-24 pb-36 flex flex-col items-center max-w-[105rem] mx-auto"
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
              className="grid gap-8 md:gap-9 lg:gap-10 w-full max-w-7xl z-20"
              style={gridStyle}
            >
              {places.length > 0 ? (
                places.map((place, idx) => {
                  // ลด animation เหลือเล็กๆ เท่านั้น
                  return (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0.5, y: 16 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        boxShadow:
                          "0 3px 15px rgba(189,178,255,0.13),0 1.5px 4px 0 #e6af4d22",
                      }}
                      whileHover={{
                        scale: 1.016,
                        z: 30,
                        boxShadow:
                          "0 11px 28px 0px #efd79f38,0 2px 6px 0 #c1adff10",
                        borderColor: "#efd299"
                      }}
                      transition={{ duration: 0.28, delay: idx * 0.02 }}
                      viewport={{ once: false, amount: 0.17 }}
                      style={{
                        transformStyle: "preserve-3d",
                        willChange: "transform,box-shadow,border-color",
                        borderRadius: 18,
                        border: "1.5px solid #fff6"
                      }}
                    >
                      <PlaceCard
                        place={place}
                        profile={profile}
                        onVote={handleVote}
                        onSelect={handleSelectPlace}
                        isSelected={selectedPlaceIds.includes(place.id)}
                        onDeletePlace={() => handleDeletePlace(place.id)}
                        isViewingTrash={isViewingTrash}
                        onRestorePlace={handleRestorePlace}
                        onPermanentDelete={handlePermanentDelete}
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

        {/* Decorative arc = เปลี่ยนเป็น rail เงาด้านล่าง */}
        {/* <div className="pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-[-45px] z-[11]" style={{
          width: "95vw",
          maxWidth: 1430,
          height: 90,
          filter: "blur(5px)",
          opacity: 0.28,
        }}>
          <svg width="100%" height="100%" viewBox="0 0 1430 90" fill="none">
            <rect x="0" y="60" width="1430" height="8" rx="3" fill="#73559e" />
            <rect x="80" y="75" width="1300" height="2.5" rx="1.5" fill="#ffd594" />
            <ellipse cx="715" cy="82" rx="700" ry="6" fill="#deb486b6" opacity="0.12" />
            <ellipse cx="700" cy="89" rx="600" ry="2.5" fill="#fffbe9" opacity="0.08" />
          </svg>
        </div> */}
      </div>
    </GlassLayout>
  );
};

export default PlanPage;
