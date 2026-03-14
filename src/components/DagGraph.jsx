import React from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Graph } from '@antv/g6';
import LoadingSpinner from './LoadingSpinner';

export default function DagGraph({ data }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    console.log('[DagGraph] data:', data);

    // 如果有数据，先清理之前的图
    if (graphRef.current) {
      console.log('[DagGraph] destroying existing graph');
      graphRef.current.destroy();
      graphRef.current = null;
    }

    if (!data) {
      setHasData(false);
      return;
    }

    setHasData(true);
    setIsLoading(true);

    const g6Data = {
      nodes: data.nodes.map((node) => ({
        id: node.id,
        label: node.label || node.id,
      })),
      edges: data.edges.map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
      })),
    };
    console.log('[DagGraph] g6Data:', g6Data);

    const renderGraph = () => {
      if (!containerRef.current) {
        console.log('[DagGraph] container not ready');
        setTimeout(renderGraph, 50);
        return;
      }

      try {
        console.log('[DagGraph] creating graph');

        const graph = new Graph({
          container: containerRef.current,
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
          behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node'],
          data: g6Data,
          edge: {
            style: {
              stroke: '#1890FF',
              lineWidth: 2,
              endArrow: true, // 结束端箭头
              endArrowType: 'vee', // 箭头类型
              endArrowSize: 10, // 箭头大小
            },
            type: 'polyline',
            router: {
              type: 'shortest-path',
              enableObstacleAvoidance: true
            },
          },
          layout: {
            type: 'antv-dagre',
            rankdir: 'TB',
            align: 'UL',
            nodesep: 10,
            ranksep: 10,
            controlPoints: false,
          },
        });

        graphRef.current = graph;
        console.log('开始绘制');
        graph.render();
        setIsLoading(false);
        console.log('[DagGraph] graph rendered');

        return () => {
          graph.destroy();
          graphRef.current = null;
        };
      } catch (error) {
        console.error('[DagGraph] error:', error);
        setIsLoading(false);
      }
    };

    renderGraph();
  }, [data]);

  const containerStyle = {
    width: '100%',
    height: '500px',
    border: '1px solid #e9ecef',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#f8f9fa',
    position: 'relative',
  };

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

  return (
    <div style={containerStyle}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '12px',
          zIndex: 10,
        }}>
          <LoadingSpinner message="正在绘制图表..." />
        </div>
      )}
    </div>
  );
}
