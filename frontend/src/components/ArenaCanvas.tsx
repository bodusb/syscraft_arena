import { memo, useCallback, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { Box, BrainCircuit, Cable, CircleDot, Clock3, Database, Eye, Network, Plug, RadioTower, Satellite } from "lucide-react";
import { initialEdges, initialNodes, RuntimeNodeData } from "../data/arenaGraph";

const nodeIcons = {
  kernel: Network,
  model: BrainCircuit,
  plugin: Plug,
  bus: RadioTower,
  gateway: Cable,
  visual: Eye,
  simulator: Satellite,
  physical: CircleDot,
  agent: BrainCircuit,
  thread: Database,
  time: Clock3,
  layer: Box,
};

function RuntimeNode({ data, selected }: NodeProps<Node<RuntimeNodeData>>) {
  const Icon = nodeIcons[data.kind];

  return (
    <div className={`runtime-node runtime-node--${data.kind} ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="runtime-node__topline">
        <span className="runtime-node__icon">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className="runtime-node__type">{data.type}</span>
      </div>
      <strong>{data.label}</strong>
      <p>{data.description}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = {
  runtime: memo(RuntimeNode),
};

function ArenaFlow() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [activeNodeId, setActiveNodeId] = useState(initialNodes[0].id);

  const activeNode = useMemo(
    () => nodes.find((node) => node.id === activeNodeId) ?? nodes[0],
    [activeNodeId, nodes],
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setActiveNodeId(node.id);
  }, []);

  const defaultEdgeOptions = useMemo<Partial<Edge>>(
    () => ({
      animated: true,
      style: { stroke: "#5a7089", strokeWidth: 1.5 },
    }),
    [],
  );

  return (
    <div className="canvas-frame">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.12}
        maxZoom={1.4}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background color="#263442" gap={28} size={1} variant={BackgroundVariant.Dots} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => (node.id === activeNodeId ? "#42d1a7" : "#344557")}
          maskColor="rgba(8, 14, 22, 0.72)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>

      <aside className="inspector-panel" aria-label="Selected runtime node">
        <p>Selected Surface</p>
        <h3>{activeNode.data.label}</h3>
        <span>{activeNode.data.type}</span>
        <div className="inspector-divider" />
        <p>{activeNode.data.description}</p>
      </aside>
    </div>
  );
}

export function ArenaCanvas() {
  return (
    <ReactFlowProvider>
      <ArenaFlow />
    </ReactFlowProvider>
  );
}
