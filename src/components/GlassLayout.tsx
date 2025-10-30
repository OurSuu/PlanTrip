import React, { useEffect, useRef, useState, type ReactNode } from "react";
// 💡 ยังคงเก็บ Vanta.js และ Three.js ไว้สำหรับเป็นพื้นหลังเริ่มต้น
import NET from "vanta/dist/vanta.net.min";
import * as THREE from "three";

interface Props {
  children: ReactNode;
  // เพิ่ม Prop สำหรับ URL วิดีโอ (ถ้ามี)
  videoUrl?: string;
}

const GlassLayout: React.FC<Props> = ({ children, videoUrl }) => {
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  // 💡 [อัปเดต!] Logic ของ Vanta.js: จะทำงานก็ต่อเมื่อ *ไม่มี* videoUrl เท่านั้น
  useEffect(() => {
    if (!videoUrl && !vantaEffect && vantaRef.current) {
      setVantaEffect(
        NET({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          color: 0x3fbbff,
          backgroundColor: 0x121222,
          points: 10.0,
          maxDistance: 25.0,
          spacing: 20.0,
        })
      );
    }
    // 💡 หากมี videoUrl เข้ามา ให้ทำลาย Vanta.js ทันที
    if (videoUrl && vantaEffect) {
      vantaEffect.destroy();
      setVantaEffect(null);
    }

    // Cleanup: ทำลาย Vanta.js เมื่อ Component ถูก unmount
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
    // เพิ่ม videoUrl ใน Dependency Array เพื่อให้ useEffect ตรวจสอบการเปลี่ยนแปลง
  }, [vantaEffect, videoUrl]);

  return (
    <div
      className="relative w-full min-h-screen flex flex-col justify-center items-center text-white"
      style={{ fontFamily: "Maath, Inter, sans-serif" }}
    >
      {/* 🎬 ส่วนพื้นหลังวิดีโอ (แสดงถ้ามี videoUrl) */}
      {videoUrl && (
        <video
          autoPlay
          loop
          muted
          // ⚠️ Z-index: ให้ต่ำกว่าเนื้อหาหลัก
          className="absolute inset-0 w-full h-full object-cover -z-20 transition-opacity duration-1000"
          src={videoUrl}
        />
      )}

      {/* 🌌 ส่วนพื้นหลัง Vanta.js (แสดงถ้าไม่มี videoUrl) */}
      {/* 💡 ให้ Vanta.js ใช้ div นี้ หากไม่มีวิดีโอ */}
      {!videoUrl && <div ref={vantaRef} className="absolute inset-0 -z-10" />}

      {children}
    </div>
  );
};

export default GlassLayout;
