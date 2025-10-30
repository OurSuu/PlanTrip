import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import styles from "./AuthPage.module.css";

import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";

const FAKE_DOMAIN = "@fakedomain.co";
const AUTH_VIDEO_URL = "../videos/test4.mp4";

const formatInputToEmail = (input: string): string => {
  const cleanInput = input.trim();
  if (cleanInput.includes("@")) {
    return cleanInput;
  }
  return cleanInput + FAKE_DOMAIN;
};

const AuthPage = () => {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const reducedMotion = useReducedMotion();

  const [isLoginView, setIsLoginView] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ฟังก์ชันสำหรับล็อกอิน
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    const emailToSend = formatInputToEmail(userInput);

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToSend,
      password: password,
    });

    if (error) {
      let customError = "Incorrect Username or Password.";
      if (error.message.includes("Email not confirmed")) {
        customError = "Email not confirmed. (Contact Admin).";
      }
      setAuthError(customError);
      showToast(`🚨 เข้าสู่ระบบไม่สำเร็จ: ${customError}`, "error");
    } else {
      await refreshSession();
      navigate("/plan");
      showToast("✅ เข้าสู่ระบบสำเร็จ!", "success");
    }
    setLoading(false);
  };

  // ฟังก์ชันสำหรับสมัครสมาชิก
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    const emailToSend = formatInputToEmail(userInput);

    const {
      data: { user: newUser },
      error: authErrorRes,
    } = await supabase.auth.signUp({
      email: emailToSend,
      password: password,
    });

    if (authErrorRes) {
      setAuthError(authErrorRes.message);
      showToast(`🚨 ลงทะเบียนล้มเหลว: ${authErrorRes.message}`, "error");
    } else if (newUser) {
      const usernameForDB = userInput.includes("@")
        ? userInput.split("@")[0]
        : userInput;

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: newUser.id,
            username: usernameForDB,
            avatar_url: null,
          },
        ]);

      if (profileError) {
        setAuthError(
          `ลงทะเบียนสำเร็จ แต่บันทึก Profile ล้มเหลว: ${profileError.message}`
        );
        showToast(
          `🚨 บันทึก Profile ล้มเหลว: ${profileError.message}`,
          "error"
        );
      } else {
        await refreshSession();
        navigate("/plan");
        showToast("✅ ลงทะเบียนสำเร็จ! เข้าสู่ระบบได้ทันที", "success");
      }
    } else {
      setAuthError("Registration failed. Please try again.");
      showToast("🚨 ลงทะเบียนไม่สำเร็จ. กรุณาลองอีกครั้ง", "error");
    }
    setLoading(false);
  };

  // ลด spec! ปรับ motion variants & style ให้เบาสุด ลื่น เร็ว
  const cardVariants = {
    initial: {
      opacity: 0.99,
      scale: 0.995,
      y: 5,
      filter: "blur(0.7px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "tween",
        duration: 0.09,
        ease: "easeInOut"
      },
    },
    exit: {
      opacity: 0.5,
      scale: 0.99,
      y: 3,
      filter: "blur(0.6px)",
      transition: {
        duration: 0.07,
        ease: "easeIn"
      },
    },
  };

  const formVariants = {
    initial: {
      opacity: 0.6,
      y: 2,
      filter: "blur(0.5px)",
      scale: 0.999,
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1.0,
      transition: { duration: 0.07, delay: 0.005, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -2,
      filter: "blur(0.5px)",
      scale: 0.999,
      transition: { duration: 0.03, ease: "easeIn" },
    },
  };

  const buttonHoverTapProps = reducedMotion
    ? { transition: { duration: 0 } }
    : {
        whileTap: { scale: 0.99 },
        whileHover: { scale: 1.01, boxShadow: "0 0 0 1px #63ffe275" },
      };

  // Palette
  const loginGrad = "linear-gradient(114deg,#7bddfb 8%,#3fbbff 90%)";
  const registerGrad =
    "linear-gradient(92deg,#ea7df5 8%, #c148e7 62%, #9b8cfb 98%)";
  const bgBlurColor = isLoginView =>
    isLoginView
      ? "rgba(30,46,78,0.68)"
      : "rgba(120,30,120,0.48)";
  const cardBorder = isLoginView =>
    isLoginView ? "1px solid #68e2fa66" : "1px solid #ec91f653";
  const cardShadow = isLoginView =>
    isLoginView
      ? "0 2px 8px 0 #3ffdff10"
      : "0 2px 12px 0 #ea7df50d";
  const headingShadow =
    "0 0 2px 0 #75ebff39, 0 0 3px 1.5px #ffcafd0c";

  return (
    <div className={styles.authContainer}>
      {/* 🎬 Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className={styles.videoBackground}
        src={AUTH_VIDEO_URL}
        style={{
          filter:
            "blur(0.7px) brightness(0.80) contrast(1.0) saturate(1)",
          opacity: 0.65,
        }}
      >
        Your browser does not support the video tag.
      </video>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className={styles.authCard}
          key={isLoginView ? "login" : "register"}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            border: cardBorder(isLoginView),
            background: bgBlurColor(isLoginView),
            boxShadow: cardShadow(isLoginView),
            backdropFilter: "blur(4px) saturate(1.01)",
            position: "relative",
            zIndex: 3,
          }}
        >
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.07 }}
            style={{
              fontSize: "2.1rem",
              background: isLoginView ? loginGrad : registerGrad,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textFillColor: "transparent",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              textShadow: headingShadow,
              filter: "contrast(1)",
              marginBottom: "0.17rem",
            }}
          >
            {isLoginView ? "เข้าสู่ระบบ 🚀" : "ลงทะเบียน ✨"}
          </motion.h1>
          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={isLoginView ? "login" : "register"}
              className={styles.authForm}
              onSubmit={isLoginView ? handleLogin : handleRegister}
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                flexDirection: "column",
                gap: "0.85rem",
                paddingTop: "0.09rem",
                alignItems: "stretch",
              }}
            >
              {/* Input fields */}
              <motion.h2
                className={styles.formHeading}
                style={{
                  color: isLoginView ? "#4ad1ff" : "#ea7df5",
                  fontWeight: 700,
                  textAlign: "center",
                  fontSize: "0.97rem",
                  textShadow:
                    isLoginView
                      ? "0 0 2px #80fff62c, 0 0 3px #2dc5e528"
                      : "0 0 3px #ffb2ff25,0 0 2px #fdafff18",
                  marginBottom: "0.29rem",
                  letterSpacing: "-0.005em",
                }}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 2 }}
                transition={{ duration: 0.046 }}
              >
                {isLoginView ? "Login to PlanTrip" : "Create an Account"}
              </motion.h2>

              <motion.input
                type="text"
                placeholder="Username หรือ ID"
                className={styles.inputField}
                autoComplete="username"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                {...buttonHoverTapProps}
                style={{
                  background: isLoginView
                    ? "linear-gradient(92deg,rgba(64,126,244,0.07),rgba(12,14,32,0.03))"
                    : "linear-gradient(88deg,#2b0b2870,rgba(54,17,82,0.04))",
                  backdropFilter: "blur(1px)",
                  border:
                    isLoginView
                      ? "0.85px solid #7bddfb25"
                      : "0.85px solid #c148e735",
                  color: "#f3fbff",
                  fontWeight: 500,
                }}
              />
              <motion.input
                type="password"
                placeholder="Password"
                className={styles.inputField}
                autoComplete={isLoginView ? "current-password" : "new-password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                {...buttonHoverTapProps}
                style={{
                  background: isLoginView
                    ? "linear-gradient(90deg,rgba(60,138,255,0.05),rgba(12,14,32,0.07))"
                    : "linear-gradient(90deg,#2b0b2850,rgba(54,17,82,0.03))",
                  backdropFilter: "blur(0.8px)",
                  border:
                    isLoginView
                      ? "0.75px solid #3fbbff25"
                      : "0.75px solid #ea7df522",
                  color: "#f3f6fb",
                  fontWeight: 500,
                }}
              />

              <motion.button
                type="submit"
                className={styles.loginButton}
                disabled={loading}
                style={{
                  background: isLoginView ? loginGrad : registerGrad,
                  boxShadow: isLoginView
                    ? "0 1px 4px 1px #5fd7ff09"
                    : "0 1px 4px 1px #ea7df516",
                  fontWeight: 600,
                  fontSize: "0.99rem",
                  borderRadius: "7px",
                  padding: "0.62rem 0.9rem",
                  color: "#fff",
                  outline: "none",
                  border: "none",
                  marginTop: "0.13rem",
                  letterSpacing: "0.01em",
                  filter: "blur(0px)",
                  cursor: loading ? "wait" : "pointer",
                  transition: "all 0.08s cubic-bezier(.63,.09,.52,1.30)",
                }}
                {...buttonHoverTapProps}
              >
                {loading
                  ? (
                      <span>
                        <span
                          style={{
                            marginRight: '5px',
                            opacity: 0.75,
                            display: "inline-block",
                            transition: "opacity 0.09s",
                          }}
                        >
                          <span style={{
                            display: "inline-block",
                            width: "1em",
                            height: "1em"
                          }}>⏳</span>
                        </span>
                        Loading...
                      </span>
                    )
                  : isLoginView
                  ? "Login"
                  : "Register"}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {authError && (
            <motion.p
              className={styles.errorMessage}
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.04 }}
              style={{
                background: isLoginView
                  ? "rgba(63, 187, 255, 0.04)"
                  : "rgba(234, 125, 245, 0.05)",
                border: isLoginView
                  ? "0.8px solid #3fbbff30"
                  : "0.8px solid #ea7df530",
                color: isLoginView ? "#63eaff" : "#ea79f5",
                filter: "blur(0px)",
                marginTop: "0.33rem",
                fontWeight: 500,
                textShadow: "0 0.5px 1.5px #fff2,0 0 1px #02ffff08",
                boxShadow:
                  "0 1px 5px 0 #2ff2ff02,0 1px 2px #d8a0fa06",
                letterSpacing: "-0.005em",
              }}
            >
              {authError}
            </motion.p>
          )}

          <motion.button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setAuthError(null);
              setUserInput("");
              setPassword("");
            }}
            className={styles.toggleButton}
            {...buttonHoverTapProps}
            style={{
              background: isLoginView ? loginGrad : registerGrad,
              color: isLoginView ? "#0a2838" : "#500c54",
              fontWeight: 700,
              marginTop: "10px",
              borderRadius: "6px",
              fontSize: "0.88rem",
              border: "none",
              outline: "none",
              boxShadow: isLoginView
                ? "0 1px 4px 1px #79eafd09"
                : "0 1px 4px 1px #ea7df50a",
              padding: "0.50rem 0.79rem",
              opacity: 0.93,
              filter: "blur(0px)",
              transition: "all 0.07s cubic-bezier(.44,.09,.62,1.00)",
              textShadow:
                isLoginView
                  ? "0 0 2px #82fff91e,0 0 2px #18ffff07"
                  : "0 0 3px #ffb2ff18,0 0 2px #ea7df513"
            }}
          >
            {isLoginView
              ? "ยังไม่มีบัญชี? สมัครเลย"
              : "มีบัญชีอยู่แล้ว? ล็อกอิน"}
          </motion.button>
        </motion.div>
      </AnimatePresence>
      {/* effect layer for luminous glow */}
      <div
        style={{
          position: "absolute",
          zIndex: 2,
          width: "110vw",
          height: "110vh",
          pointerEvents: "none",
          left: "-4vw",
          top: "-5vh",
          background:
            isLoginView
              ? "radial-gradient(ellipse at 80% 0%, #8ffcff04 0%, #48d6ff07 70%, #00ffff00 100%)"
              : "radial-gradient(ellipse at 15% 18%, #ffccf104 0%, #ea7df509 62%, #4e009705 100%)",
          filter: "blur(7px) opacity(0.27)",
        }}
      />
    </div>
  );
};

export default AuthPage;