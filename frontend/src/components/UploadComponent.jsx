import { useRef, useState } from 'react';

export default function UploadComponent({ owner, onUpload, isUploading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file || !owner.trim()) {
      return;
    }

    await onUpload(file);
    setFile(null);
    inputRef.current.value = '';
  }

  return (
    <section className="panel upload-panel" aria-labelledby="upload-title">
      <div className="panel-heading">
        <p className="eyebrow">Novo documento</p>
        <h2 id="upload-title">Enviar arquivo</h2>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="file-picker" htmlFor="document-file">
          <span>Selecione um arquivo</span>
          <input
            ref={inputRef}
            id="document-file"
            type="file"
            onChange={(event) => setFile(event.target.files[0] || null)}
            disabled={isUploading}
          />
          <strong>{file ? file.name : 'Nenhum arquivo selecionado'}</strong>
        </label>
        <button type="submit" disabled={!file || !owner.trim() || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
    </section>
  );
}