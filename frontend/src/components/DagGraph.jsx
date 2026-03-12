import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useLayoutWorker } from '../hooks/useLayoutWorker';
import LoadingSpinner from './LoadingSpinner';

export default function DagGraph({ data }) {
  const [hasData, setHasData] = useState(false);
  const { calculateLayout, isLoading, error } = useLayoutWorker();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    console.log('[DagGraph] 数据更新:', data ? { nodes: data.nodes.length, edges: data.edges.length } : null);

    if (!data) {
      console.log('[DagGraph] 无数据，清空布局');
      setNodes([]);
      setEdges([]);
      setHasData(false);
      return;
    }

    setHasData(true);

    const preparedNodes = data.nodes.map((n) => ({
      id: n.id,
      data: { label: n.label || n.id },
    }));
    const preparedEdges = data.edges.map((e) => ({
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: true,
    }));

    console.log('[DagGraph] 数据准备完成，开始布局计算');
    // 使用 Worker 计算布局
    calculateLayout(preparedNodes, preparedEdges)
      .then((result) => {
        console.log('[DagGraph] 布局完成，更新显示', result.nodes.length, 'nodes');
        setNodes(result.nodes);
        setEdges(result.edges);
      })
      .catch((err) => {
        console.error('[DagGraph] 布局计算失败:', err);
        // 如果 Worker 失败，至少显示节点（虽然没有位置）
        setNodes(preparedNodes);
        setEdges(preparedEdges);
      });
  }, [data, calculateLayout, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // 容器样式
  const containerStyle = {
    width: '100%',
    height: '500px',
    border: '1px solid #e9ecef',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#fff',
  };

  // 空状态
  if (!hasData) {
    return (
      <div style={{
        ...containerStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        background: '#f8f9fa',
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

  // 加载状态
  if (isLoading) {
    return (
      <div style={containerStyle}>
        <LoadingSpinner message="正在计算布局..." />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{
        ...containerStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ marginTop: '16px', color: '#495057', fontSize: '14px' }}>
          布局计算出错
        </p>
        <p style={{ marginTop: '4px', color: '#868e96', fontSize: '12px' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
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