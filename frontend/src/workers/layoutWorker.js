import ELK from 'elkjs/lib/elk.bundled.js';

console.log('[layoutWorker] Worker 脚本加载中');

const elk = new ELK();
console.log('[layoutWorker] ELK 初始化完成');

// 布局配置选项
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.separateConnectedComponents': 'true',
};

// 快速简化布局（针对大量数据优化）
function getSimpleLayout(nodes, edges) {
  console.log('[layoutWorker] 开始快速简化布局');

  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  // 使用对象字面量代替 Map 以提高速度
  const inDegree = {};
  const outDegree = {};

  // 初始化入度和出度
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    inDegree[id] = 0;
    outDegree[id] = 0;
  }

  // 计算入度和出度
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    outDegree[e.source] = (outDegree[e.source] || 0) + 1;
    inDegree[e.target] = (inDegree[e.target] || 0) + 1;
  }

  // BFS 计算层级
  const levels = {};
  const queue = [];

  // 找到根节点（入度为 0）
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    if (inDegree[id] === 0) {
      levels[id] = 0;
      queue.push(id);
    }
  }

  // BFS 遍历
  while (queue.length > 0) {
    const nodeId = queue.shift();
    const currentLevel = levels[nodeId];

    // 只检查与当前节点相关的边，减少遍历次数
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (e.source === nodeId && !levels[e.target]) {
        levels[e.target] = currentLevel + 1;
        queue.push(e.target);
      }
    }
  }

  // 为未分配层级的节点（环或孤立节点）分配默认层级
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    if (!levels[id]) {
      levels[id] = 0;
    }
  }

  // 按层级分组
  const levelGroups = {};
  for (let i = 0; i < nodes.length; i++) {
    const id = nodes[i].id;
    const level = levels[id] || 0;
    if (!levelGroups[level]) {
      levelGroups[level] = [];
    }
    levelGroups[level].push(id);
  }

  // 计算位置
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

  console.log('[layoutWorker] 快速简化布局完成');
  return { nodes: layoutedNodes, edges };
}

// ELK布局（优化超时和性能）
async function getElkLayout(nodes, edges, timeout = 10000) {
  const totalElements = nodes.length + edges.length;

  // 对于大量元素，减少超时时间
  const adjustedTimeout = totalElements > 500 ? 5000 : timeout;

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

  const layoutPromise = elk.layout(graph);

  try {
    const layoutedGraph = await Promise.race([
      layoutPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('布局超时')), adjustedTimeout)
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

// 根据数据量选择布局方式（优化数据量判断）
async function getLayoutedElements(nodes, edges) {
  const totalElements = nodes.length + edges.length;
  console.log(`[layoutWorker] 数据集大小: ${nodes.length} 节点, ${edges.length} 边`);

  // 大数据量直接使用简化布局（性能更好）
  if (totalElements > 500) {
    console.log(`[layoutWorker] 大数据集 (${totalElements} 元素)，使用快速简化布局`);
    const startTime = Date.now();
    const result = getSimpleLayout(nodes, edges);
    console.log(`[layoutWorker] 快速简化布局耗时: ${Date.now() - startTime}ms`);
    return result;
  }

  console.log(`[layoutWorker] 小数据集 (${totalElements} 元素)，使用 ELK 布局`);
  const startTime = Date.now();
  const result = await getElkLayout(nodes, edges);
  console.log(`[layoutWorker] ELK 布局耗时: ${Date.now() - startTime}ms`);
  return result;
}

// Worker 消息处理
self.onmessage = async function (e) {
  const { type, payload } = e.data;

  try {
    if (type === 'CALCULATE_LAYOUT') {
      console.log('[layoutWorker] 收到布局计算请求:', {
        nodeCount: payload.nodes.length,
        edgeCount: payload.edges.length,
      });

      const startTime = Date.now();
      const result = await getLayoutedElements(payload.nodes, payload.edges);
      const duration = Date.now() - startTime;

      console.log('[layoutWorker] 布局计算完成', {
        nodeCount: payload.nodes.length,
        edgeCount: payload.edges.length,
        durationMs: duration,
        resultNodeCount: result.nodes.length,
      });

      self.postMessage({
        type: 'LAYOUT_SUCCESS',
        payload: result,
      });
    }
  } catch (error) {
    console.error('[layoutWorker] 布局计算异常:', error);
    self.postMessage({
      type: 'LAYOUT_ERROR',
      payload: { message: error.message },
    });
  }
};
