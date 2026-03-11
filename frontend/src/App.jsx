import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import DagGraph from './components/DagGraph';

function App() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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
        if (!row[0] || !row[1]) continue;

        const source = String(row[0]).trim();
        const target = String(row[1]).trim();

        if (!source || !target) continue;

        nodes.set(source, { id: source, label: source });
        nodes.set(target, { id: target, label: target });
        edges.push({ source, target });
      }

      if (nodes.size === 0) {
        throw new Error('Excel文件中没有有效数据');
      }

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
            上传Excel文件，自动生成有向无环图
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