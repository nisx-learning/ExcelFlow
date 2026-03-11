import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import '@xyflow/react/dist/style.css';

const elk = new ELK();

// 大数据时使用更快的布局配置
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.separateConnectedComponents': 'true',
};

// 简化布局（不计算精确位置，按层级排列）
async function getSimpleLayout(nodes, edges) {
  // 找出每个节点的层级（基于入度和出度）
  const inDegree = new Map();
  const outDegree = new Map();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  });

  edges.forEach(e => {
    outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  // BFS 计算层级
  const levels = new Map();
  const queue = [];

  // 从根节点（没有入边）开始
  nodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      levels.set(n.id, 0);
      queue.push(n.id);
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift();
    const currentLevel = levels.get(nodeId);

    edges.forEach(e => {
      if (e.source === nodeId && !levels.has(e.target)) {
        levels.set(e.target, currentLevel + 1);
        queue.push(e.target);
      }
    });
  }

  // 未分配层级的节点（可能是环或孤立节点）
  nodes.forEach(n => {
    if (!levels.has(n.id)) {
      levels.set(n.id, 0);
    }
  });

  // 按层级分组
  const levelGroups = new Map();
  nodes.forEach(n => {
    const level = levels.get(n.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level).push(n.id);
  });

  // 计算位置
  const NODE_WIDTH = 150;
  const NODE_HEIGHT = 40;
  const HORIZONTAL_GAP = 80;
  const VERTICAL_GAP = 100;

  const layoutedNodes = nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const siblings = levelGroups.get(level) || [];
    const index = siblings.indexOf(node.id);

    return {
      ...node,
      position: {
        x: index * (NODE_WIDTH + HORIZONTAL_GAP),
        y: level * (NODE_HEIGHT + VERTICAL_GAP),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ELK布局（带超时保护）
async function getElkLayout(nodes, edges, timeout = 10000) {
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

  // 使用Promise.race实现超时
  const layoutPromise = elk.layout(graph);

  try {
    const layoutedGraph = await Promise.race([
      layoutPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('布局超时')), timeout)
      ),
    ]);

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
  } catch (error) {
    console.warn('ELK布局失败，使用简化布局:', error.message);
    return getSimpleLayout(nodes, edges);
  }
}

// 根据数据量选择布局方式
async function getLayoutedElements(nodes, edges) {
  const totalElements = nodes.length + edges.length;

  // 大数据量使用简化布局
  if (totalElements > 500) {
    console.log(`大数据集 (${totalElements} 元素)，使用简化布局`);
    return getSimpleLayout(nodes, edges);
  }

  // 小数据量使用ELK布局
  return getElkLayout(nodes, edges);
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