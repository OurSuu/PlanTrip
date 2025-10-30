import React from 'react';
import type { Profile } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Props {
  profile: Profile;
}

const Navbar: React.FC<Props> = ({ profile }) => {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-3 text-white"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      <Link to="/plan" className="text-xl font-bold drop-shadow-md">
        PlanTrip
      </Link>
      <Link to="/profile" className="flex items-center gap-2 hover:scale-105 transition">
        <img
          src={profile.avatar_url || "https://i.imgur.com/G5iE1G3.png"}
          alt="avatar"
          className="w-8 h-8 rounded-full border border-white/30 shadow-lg object-cover"
        />
        <span>สวัสดี, {profile.username}!</span>
      </Link>
    </nav>
  );
};

export default Navbar;