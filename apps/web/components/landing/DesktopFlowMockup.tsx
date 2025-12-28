"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { FiMessageSquare, FiCpu, FiZap } from "react-icons/fi";
import { MdAutoAwesome, MdOutlineSmartToy } from "react-icons/md";
import { BsWhatsapp, BsFacebook, BsInstagram, BsTelegram } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";

interface DesktopFlowMockupProps {
  showDesktop: boolean;
}

const CustomNode = ({ data }: any) => {
  const Icon = data.icon;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: data.delay || 0
      }}
      className="relative"
    >
      <div className={`relative bg-gradient-to-br ${data.gradient} rounded-xl shadow-2xl border-2 border-white/20 min-w-[160px] backdrop-blur-sm`}>
        {}
        <div className="px-4 py-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="text-white text-base" />}
            <div className="text-white text-xs font-bold tracking-wide uppercase">{data.label}</div>
          </div>
        </div>
        
        {}
        <div className="px-4 py-3">
          {data.subtitle && (
            <div className="text-white/90 text-[11px] leading-relaxed">{data.subtitle}</div>
          )}
          {data.children}
        </div>
        
        {}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-xl pointer-events-none" />
      </div>
    </motion.div>
  );
};

const ChannelIcons = () => (
  <div className="flex gap-2 mt-1">
    <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-md flex items-center justify-center shadow-md">
      <BsWhatsapp className="text-white text-xs" />
    </div>
    <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center shadow-md">
      <BsFacebook className="text-white text-xs" />
    </div>
    <div className="w-7 h-7 bg-gradient-to-br from-pink-400 to-pink-600 rounded-md flex items-center justify-center shadow-md">
      <BsInstagram className="text-white text-xs" />
    </div>
    <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-sky-600 rounded-md flex items-center justify-center shadow-md">
      <BsTelegram className="text-white text-xs" />
    </div>
  </div>
);

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    position: { x: 40, y: 30 },
    data: { 
      label: "Trigger",
      subtitle: "Customer sends message",
      icon: HiSparkles,
      gradient: "from-emerald-500 to-teal-600",
      delay: 0.2
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "2",
    type: "custom",
    position: { x: 280, y: 30 },
    data: { 
      label: "Channels",
      icon: null,
      gradient: "from-slate-700 to-slate-800",
      children: <ChannelIcons />,
      delay: 0.3
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "3",
    type: "custom",
    position: { x: 140, y: 160 },
    data: { 
      label: "AI Agent",
      subtitle: "Analyze context & intent",
      icon: MdAutoAwesome,
      gradient: "from-purple-500 to-indigo-600",
      delay: 0.5
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "4",
    type: "custom",
    position: { x: 420, y: 160 },
    data: { 
      label: "Router",
      subtitle: "Smart routing",
      icon: MdOutlineSmartToy,
      gradient: "from-orange-500 to-red-600",
      delay: 0.6
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "5",
    type: "custom",
    position: { x: 100, y: 290 },
    data: { 
      label: "Auto Reply",
      subtitle: "Automatic response",
      icon: FiMessageSquare,
      gradient: "from-blue-500 to-cyan-600",
      delay: 0.8
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "6",
    type: "custom",
    position: { x: 440, y: 290 },
    data: { 
      label: "Handoff",
      subtitle: "Transfer to staff",
      icon: FiCpu,
      gradient: "from-teal-500 to-emerald-600",
      delay: 0.9
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "rgba(16, 185, 129, 0.7)", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(16, 185, 129, 0.7)" },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
    style: { stroke: "rgba(139, 92, 246, 0.7)", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(139, 92, 246, 0.7)" },
    type: "smoothstep",
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    animated: true,
    style: { stroke: "rgba(168, 85, 247, 0.7)", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(168, 85, 247, 0.7)" },
    type: "smoothstep",
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    animated: true,
    style: { stroke: "rgba(59, 130, 246, 0.7)", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(59, 130, 246, 0.7)" },
    type: "smoothstep",
  },
  {
    id: "e4-6",
    source: "4",
    target: "6",
    animated: true,
    style: { stroke: "rgba(20, 184, 166, 0.7)", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(20, 184, 166, 0.7)" },
    type: "smoothstep",
  },
];

export default function DesktopFlowMockup({ showDesktop }: DesktopFlowMockupProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (showDesktop) {
      setEdges([]);
      initialEdges.forEach((edge, index) => {
        setTimeout(() => {
          setEdges((eds) => [...eds, edge]);
        }, (index + 1) * 200);
      });
    } else {
      setEdges([]);
    }
  }, [showDesktop, setEdges]);

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: showDesktop ? 1 : 0,
        scale: showDesktop ? 1 : 0.8,
        display: showDesktop ? "block" : "none",
      }}
      transition={{ duration: 0.3 }}
      className="relative mx-auto"
    >
      {}
      <div className="relative">
        {}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-2xl p-3 shadow-2xl">
          <div className="bg-slate-950 rounded-lg overflow-hidden h-[420px] w-[680px] relative">
            {}
            <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 border-b border-slate-700/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"></div>
              </div>
              <div className="flex-1 bg-slate-800/50 rounded-md px-4 py-1.5 text-xs text-slate-400 flex items-center gap-2">
                <FiZap className="text-purple-400" size={12} />
                <span className="text-slate-300">app.yourplatform.com</span>
                <span className="text-slate-600">/</span>
                <span className="text-purple-400">flows</span>
              </div>
            </div>

            {}
            <div className="relative h-full bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950">
              {}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0" />

              {}
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={false}
                panOnScroll={false}
                panOnDrag={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
                proOptions={{ hideAttribution: true }}
                className="!bg-transparent"
              >
                <Background 
                  gap={30} 
                  size={1}
                  color="rgba(99, 102, 241, 0.1)"
                  className="opacity-20"
                />
              </ReactFlow>

              {}
              {showDesktop && [...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400/40 rounded-full blur-[0.5px] pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    x: [0, (Math.random() - 0.5) * 80],
                    y: [0, (Math.random() - 0.5) * 80],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut"
                  }}
                  style={{
                    left: `${30 + Math.random() * 40}%`,
                    top: `${30 + Math.random() * 40}%`,
                    zIndex: 1
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 h-4 rounded-b-2xl shadow-xl"></div>
        <div className="bg-gray-700 h-2 w-56 mx-auto rounded-b-lg shadow-lg"></div>
      </div>
    </motion.div>
  );
}
