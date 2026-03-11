import { useCallback, useEffect, useMemo, useState } from 'react';
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
    if (!data) return;

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

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>请上传Excel文件</div>;
  }

  return (
    <div style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}