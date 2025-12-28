"use client";

import { motion } from "framer-motion";
import { FiMessageSquare, FiZap } from "react-icons/fi";
import { MdAutoAwesome } from "react-icons/md";

export default function MobileChatMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mx-auto border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl"
    >
      <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
      <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
      <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white relative">
        {}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white overflow-hidden">
          {}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-lg z-20 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MdAutoAwesome className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">WataOmi Bot</div>
                <div className="text-indigo-100 text-xs flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Active
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-140px)]">
            {}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-2"
            >
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MdAutoAwesome className="text-indigo-600 text-xs" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[75%]">
                <p className="text-xs text-slate-700">Hello! How can I help you?</p>
              </div>
            </motion.div>

            {}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-end"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[75%]">
                <p className="text-xs text-white">I want to know about the products</p>
              </div>
            </motion.div>

            {}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              className="flex gap-2"
            >
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MdAutoAwesome className="text-indigo-600 text-xs" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            {}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8 }}
              className="flex gap-2"
            >
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MdAutoAwesome className="text-indigo-600 text-xs" />
              </div>
              <div className="space-y-2 max-w-[75%]">
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <p className="text-xs text-slate-700">
                    We have many great products! Are you interested in:
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full text-xs text-indigo-700 font-medium">
                    AI Chatbot
                  </div>
                  <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full text-xs text-purple-700 font-medium">
                    Automation
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
              <FiMessageSquare className="text-slate-400 text-sm" />
              <div className="flex-1 text-xs text-slate-400">Type a message...</div>
              <FiZap className="text-indigo-600 text-sm" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
