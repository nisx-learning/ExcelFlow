import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import '@xyflow/react/dist/style.css';

const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
};

async function getLayoutedElements(nodes, edges) {
  const graph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: 150,
      height: 40,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(graph);

  const layoutedNodes = layoutedGraph.children?.map((node) => {
    const originalNode = nodes.find((n) => n.id === node.id);
    return {
      ...originalNode,
      position: {
        x: node.x - 75,
        y: node.y - 20,
      },
    };
  }) || [];

  return { nodes: layoutedNodes, edges };
}

export default function DagGraph({ data }) {
  const [layoutedData, setLayoutedData] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    if (!data) {
      setLayoutedData({ nodes: [], edges: [] });
      return;
    }

    const nodes = data.nodes.map((n) => ({ id: n.id, data: { label: n.label || n.id } }));
    const edges = data.edges.map((e) => ({ id: `${e.source}-${e.target}`, source: e.source, target: e.target, animated: true }));

    getLayoutedElements(nodes, edges).then(setLayoutedData);
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedData.edges);

  useEffect(() => {
    setNodes(layoutedData.nodes);
    setEdges(layoutedData.edges);
  }, [layoutedData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // 空状态
  if (!data) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        background: '#f8f9fa',
        borderRadius: '12px',
        border: '2px dashed #dee2e6',
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5">
          <path d="M9 17H7A5 5 0 0 1 7 7h2" />
          <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <p style={{ marginTop: '20px', color: '#868e96', fontSize: '16px' }}>
          请上传Excel文件
        </p>
        <p style={{ marginTop: '8px', color: '#adb5bd', fontSize: '13px' }}>
          A列=源节点，B列=目标节点
        </p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '500px',
      border: '1px solid #e9ecef',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#f1f3f5" gap={20} />
        <Controls
          style={{
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
      </ReactFlow>
    </div>
  );
}