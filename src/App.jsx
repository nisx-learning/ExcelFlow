import React from 'react';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import DagGraph from './components/DagGraph';
import { exportToDrawIO } from './utils/drawioExporter';

function App() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // 测试数据
  const testData = {
    nodes: [
      { id: 'A', label: '节点 A' },
      { id: 'B', label: '节点 B' },
      { id: 'C', label: '节点 C' },
      { id: 'D', label: '节点 D' },
    ],
    edges: [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'C' },
      { source: 'B', target: 'D' },
      { source: 'C', target: 'D' },
    ],
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const nodes = new Map();
      const edges = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[0]) continue;

        const target = String(row[0]).trim();
        if (!target) continue;

        // 添加目标节点（无论是否有源节点）
        nodes.set(target, { id: target, label: target });

        // 处理源节点（如果有）
        if (row[1]) {
          const sourcesStr = String(row[1]).trim();
          if (sourcesStr) {
            // 将源节点字符串按逗号分割
            const sources = sourcesStr.split(/[,，]/).map(s => s.trim()).filter(s => s);

            // 处理每个源节点
            for (const source of sources) {
              if (!source) continue;

              nodes.set(source, { id: source, label: source });
              edges.push({ source, target });
            }
          }
        }
      }

      if (nodes.size === 0) {
        throw new Error('Excel文件中没有有效数据');
      }
      console.log('excel解析完成')
      setGraphData({
        nodes: Array.from(nodes.values()),
        edges,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      // 每次都重置input，允许重复上传同一文件
      event.target.value = '';
    }
  };

  const handleTestData = () => {
    setGraphData(testData);
  };

  const handleExportDrawIO = async () => {
    if (!graphData) {
      alert('请先上传或加载数据');
      return;
    }

    try {
      await exportToDrawIO(graphData);
    } catch (error) {
      alert(`导出失败: ${error.message}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* 头部 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px 40px',
          color: '#fff',
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
            Excel DAG 可视化
          </h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            上传Excel文件，自动生成有向无环图。格式：第1列=目的节点，第2列=源节点（可选，多个用逗号分隔）
          </p>
        </div>

        {/* 上传区域 */}
        <div style={{ padding: '30px 40px', borderBottom: '1px solid #eee' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              选择Excel文件
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={loading}
                style={{ display: 'none' }}
              />
            </label>

            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              border: 'none',
            }}
            onClick={handleTestData}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              测试数据
            </button>

            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              border: 'none',
            }}
            onClick={handleExportDrawIO}
            disabled={!graphData}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              导出Draw.io
            </button>

            {loading && (
              <span style={{ color: '#667eea', fontSize: '14px' }}>
                解析中...
              </span>
            )}
            <span style={{ color: '#888', fontSize: '13px' }}>
              支持 .xlsx, .xls 格式
            </span>
          </div>

          {error && (
            <div style={{
              marginTop: '15px',
              padding: '12px 16px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '14px',
            }}>
              错误: {error}
            </div>
          )}
        </div>

        {/* 图表区域 */}
        <div style={{ padding: '30px 40px' }}>
          <DagGraph data={graphData} />
        </div>
      </div>
    </div>
  );
}

export default App;