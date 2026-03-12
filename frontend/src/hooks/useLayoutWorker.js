import { useCallback, useState } from 'react';

// 快速简化布局算法
function getSimpleLayout(nodes, edges) {
  console.log('[useLayoutWorker] 使用简化布局');

  const inDegree = {};
  const outDegree = {};

  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    inDegree[id] = 0;
    outDegree[id] = 0;
  }

  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    outDegree[e.source] = (outDegree[e.source] || 0) + 1;
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
  }

  const levels = {};
  const queue = [];

  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    if (inDegree[id] === 0) {
      levels[id] = 0;
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift();
    const currentLevel = levels[nodeId];

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (e.source === nodeId && !levels[e.target]) {
        levels[e.target] = currentLevel + 1;
        queue.push(e.target);
      }
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    if (!levels[id]) {
      levels[id] = 0;
    }
  }

  const levelGroups = {};
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    const level = levels[id] || 0;
    if (!levelGroups[level]) {
      levelGroups[level] = [];
    }
    levelGroups[level].push(id);
  }

  const NODE_WIDTH = 150;
  const NODE_HEIGHT = 40;
  const HORIZONTAL_GAP = 80;
  const VERTICAL_GAP = 100;

  const layoutedNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const level = levels[node.id] || 0;
    const siblings = levelGroups[level] || [];
    const index = siblings.indexOf(node.id);

    layoutedNodes.push({
      ...node,
      position: {
        x: index * (NODE_WIDTH + HORIZONTAL_GAP),
        y: level * (NODE_HEIGHT + VERTICAL_GAP),
      },
    });
  }

  return { nodes: layoutedNodes, edges };
}

export function useLayoutWorker() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 计算布局的函数 - 使用 setTimeout 防止阻塞主线程
  const calculateLayout = useCallback((nodes, edges) => {
    console.log('[useLayoutWorker] calculateLayout 调用');

    return new Promise((resolve) => {
      setIsLoading(true);
      setError(null);

      // 使用 setTimeout 让 UI 先更新，再计算
      setTimeout(() => {
        try {
          const result = getSimpleLayout(nodes, edges);
          setIsLoading(false);
          resolve(result);
        } catch (err) {
          console.error('[useLayoutWorker] 布局计算错误:', err);
          setIsLoading(false);
          setError(err.message);
          resolve({ nodes, edges });
        }
      }, 0);
    });
  }, []);

  return { calculateLayout, isLoading, error };
}
