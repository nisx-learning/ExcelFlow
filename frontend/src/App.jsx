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

      // 从第二行开始读取（A列=源节点，B列=目标节点）
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
    }
  };

  const handleReUpload = () => {
    fileInputRef.current.value = '';
    setGraphData(null);
    setError(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Excel DAG 可视化</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          disabled={loading}
          style={{ marginRight: '10px' }}
        />
        {loading && <span>解析中...</span>}
        {graphData && (
          <button onClick={handleReUpload} style={{ marginLeft: '10px' }}>
            重新上传
          </button>
        )}
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>错误: {error}</div>}

      <DagGraph data={graphData} />
    </div>
  );
}

export default App;