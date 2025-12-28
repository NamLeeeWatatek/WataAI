"use client";

import { motion } from "framer-motion";
import MobileChatMockup from "./MobileChatMockup";
import FloatingCards from "./FloatingCards";

export default function HeroDeviceMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative z-10 hidden lg:block"
    >
      {}
      <MobileChatMockup />

      {}
      <FloatingCards />
    </motion.div>
  );
}

