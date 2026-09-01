import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments, uploadDocument } from './services/documentsApi';
import './App.css';

export default function App() {
  const [owner, setOwner] = useState('usuario-demo');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const normalizedOwner = owner.trim();

    if (!normalizedOwner) {
      setDocuments([]);
      return undefined;
    }

    const controller = new AbortController();

    async function loadDocuments() {
      setIsLoading(true);

      try {
        const loadedDocuments = await listDocuments(normalizedOwner, {
          signal: controller.signal,
        });
        setDocuments(loadedDocuments);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setFeedback({ type: 'error', message: error.message });
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [owner]);

  async function handleUpload(file) {
    setIsUploading(true);
    setFeedback(null);

    try {
      const document = await uploadDocument(file, owner.trim());
      setDocuments((currentDocuments) => [document, ...currentDocuments]);
      setFeedback({ type: 'success', message: 'Documento enviado com sucesso.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Arquivo pessoal</p>
          <h1>Document Management System</h1>
        </div>
        <label className="owner-field" htmlFor="owner">
          Identificador do usuário
          <input
            id="owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Ex.: usuario-123"
          />
        </label>
      </header>

      <div className="workspace">
        <UploadComponent owner={owner} onUpload={handleUpload} isUploading={isUploading} />
        <DocumentList
          documents={documents}
          owner={owner.trim()}
          isLoading={isLoading}
          onError={(message) => setFeedback({ type: 'error', message })}
        />
      </div>

      {feedback && (
        <p className={`feedback ${feedback.type}`} role="status">
          {feedback.message}
        </p>
      )}
    </main>
  );
}
