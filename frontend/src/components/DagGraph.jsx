import { useLayoutEffect, useRef, useState } from 'react';
import G6 from '@antv/g6';
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

        const graph = new G6.Graph({
          container: containerRef.current,
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
          modes: {
            default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
          },
          defaultNode: {
            type: 'rect',
            size: [150, 40],
            style: {
              fill: '#667eea',
              stroke: '#5a67d8',
              lineWidth: 2,
              radius: 8,
            },
            labelCfg: {
              style: {
                fill: '#fff',
                fontSize: 14,
                fontWeight: 500,
              },
            },
          },
          defaultEdge: {
            type: 'cubic-horizontal',
            style: {
              stroke: '#a855f7',
              lineWidth: 2,
              endArrow: {
                path: G6.Arrow.triangle(8, 10, 0),
                fill: '#a855f7',
              },
            },
          },
          layout: {
            type: 'dagre',
            rankdir: 'TB',
            align: 'UL',
            nodesep: 80,
            ranksep: 100,
          },
        });

        graphRef.current = graph;
        let layoutCompleted = false;

        // 监听布局完成事件
        graph.on('afterlayout', () => {
          if (!layoutCompleted) {
            layoutCompleted = true;
            console.log('[DagGraph] afterlayout');
            try {
              graph.fitView(20);
              console.log('[DagGraph] fitView completed');
            } catch (e) {
              console.error('[DagGraph] fitView error:', e);
            }
            setIsLoading(false);
          }
        });

        // 备用方案：如果 afterlayout 没触发，3秒后自动执行
        const backupTimer = setTimeout(() => {
          if (!layoutCompleted) {
            console.log('[DagGraph] using backup fitView');
            try {
              graph.fitView(20);
            } catch (e) {
              console.error('[DagGraph] backup fitView error:', e);
            }
            setIsLoading(false);
          }
        }, 3000);

        graph.data(g6Data);
        graph.render();

        console.log('[DagGraph] graph rendered');

        return () => {
          clearTimeout(backupTimer);
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
