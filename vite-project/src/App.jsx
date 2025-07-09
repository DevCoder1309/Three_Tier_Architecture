import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [file, setFile] = useState(null);

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData);
      alert('Uploaded: ' + res.data.message);
    } catch (err) {
      alert('Upload failed');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Vulnerable Image Uploader</h2>
      <input
  type="file"
  accept=".jpg, .jpeg, .png"
  onChange={(e) => setFile(e.target.files[0])}
/>
      <button onClick={uploadFile}>Upload</button>
    </div>
  );
};

export default App;
