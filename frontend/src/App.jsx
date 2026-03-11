import { useState, useRef } from 'react';
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/excel/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 支持重复上传
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