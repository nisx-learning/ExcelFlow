import ELK from 'elkjs';

/**
 * 使用ELK算法计算布局并导出draw.io文件
 * @param {Object} graphData - 图数据 { nodes: [], edges: [] }
 */
export async function exportToDrawIO(graphData) {
  if (!graphData || !graphData.nodes || !graphData.edges) {
    throw new Error('无效的图数据');
  }

  // 1. 使用ELK计算布局
  const elk = new ELK();
  const elkGraph = convertToELKFormat(graphData);

  try {
    const layoutedGraph = await elk.layout(elkGraph);
    console.log('[DrawIO] ELK布局结果:', layoutedGraph);

    // 2. 生成draw.io XML
    const mxGraphXml = generateMxGraphXml(layoutedGraph);

    // 3. 下载文件
    downloadFile(mxGraphXml, 'dag-export.drawio');
  } catch (error) {
    console.error('[DrawIO] 布局或导出失败:', error);
    throw error;
  }
}

/**
 * 将数据转换为ELK格式
 */
function convertToELKFormat(graphData) {
  const elkNodes = graphData.nodes.map(node => ({
    id: node.id,
    labels: [{ text: node.label || node.id }],
    // 设置节点大小
    width: 120,
    height: 60,
  }));

  const elkEdges = graphData.edges.map((edge, index) => ({
    id: `e-${index}`,
    sources: [edge.source],
    targets: [edge.target],
  }));

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      // 1. 强制开启正交路由（避障的前提）
      'elk.edgeRouting': 'ORTHOGONAL',
      // 2. 设置边与节点之间的最小距离，值越大，绕行越明显
      'elk.spacing.edgeNode': '30',
      // 3. 设置边与边之间的距离，防止多条线重叠在一起
      'elk.spacing.edgeEdge': '15',
      // 4. 优化连线，使其尽量直线，只在必要时绕路
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      // 5. 增大层级间距，给“绕路”留出足够的水平空间
      'elk.layered.spacing.edgeNodeOnLayer': '20',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80'
    },
    children: elkNodes,
    edges: elkEdges,
  };
}

/**
 * 生成mxGraph格式的XML (draw.io格式)
 */
function generateMxGraphXml(layoutedGraph) {
  const nodeMap = new Map();
  const idMap = new Map(); // 存储原ID到新ID的映射
  let nodesXml = '';
  let edgesXml = '';

  // 处理节点 - 添加唯一前缀
  if (layoutedGraph.children) {
    layoutedGraph.children.forEach((node, index) => {
      const x = node.x || 0;
      const y = node.y || 0;
      const width = node.width || 120;
      const height = node.height || 60;
      const label = node.labels?.[0]?.text || node.id;

      const uniqueId = `n-${index}`; // 使用唯一前缀
      idMap.set(node.id, uniqueId);
      nodeMap.set(uniqueId, { x, y, width, height });

      // mxCell样式 - 圆角矩形
      const style = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;';

      nodesXml += `
    <mxCell id="${uniqueId}" value="${escapeXml(label)}" style="${style}" vertex="1" parent="1">
      <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>
    </mxCell>`;
    });
  }

  // 处理边
  if (layoutedGraph.edges) {
    layoutedGraph.edges.forEach((edge, index) => {
      const sourceId = idMap.get(edge.sources?.[0]);
      const targetId = idMap.get(edge.targets?.[0]);
      const edgeId = `e-${index}`;

      if (!sourceId || !targetId) {
        console.warn(`Skipping edge - source or target not found: ${edge.id}`);
        return;
      }

      // 构建边的路径点
      let pointsXml = '';
      if (edge.sections && edge.sections.length > 0) {
        const section = edge.sections[0];
        if (section.bendPoints && section.bendPoints.length > 0) {
          pointsXml = '<Array as="points">';
          section.bendPoints.forEach(point => {
            pointsXml += `<mxPoint x="${point.x}" y="${point.y}" as="point"/>`;
          });
          pointsXml += '</Array>';
        }
      }

      // mxCell样式 - 箭头线
      const style = 'endArrow=classic;html=1;strokeWidth=2;strokeColor=#6c8ebf;';

      edgesXml += `
    <mxCell id="${edgeId}" style="${style}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
      <mxGeometry width="50" height="50" relative="1" as="geometry">
        ${pointsXml}
      </mxGeometry>
    </mxCell>`;
    });
  }

  // 计算画布大小，添加一些边距
  const padding = 50;
  const graphWidth = (layoutedGraph.width || 800) + padding * 2;
  const graphHeight = (layoutedGraph.height || 600) + padding * 2;

  return `<mxfile host="app.diagrams.net">
  <diagram id="dag-diagram" name="DAG Diagram">
    <mxGraphModel dx="${padding}" dy="${padding}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${graphWidth}" pageHeight="${graphHeight}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${nodesXml}
        ${edgesXml}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

/**
 * 转义XML特殊字符
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 下载文件
 */
function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
