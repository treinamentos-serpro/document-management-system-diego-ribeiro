import DownloadButton from './DownloadButton';

function formatFileSize(size) {
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DocumentList({ documents, owner, isLoading, onError }) {
  return (
    <section className="panel documents-panel" aria-labelledby="documents-title">
      <div className="panel-heading list-heading">
        <div>
          <p className="eyebrow">Arquivos enviados</p>
          <h2 id="documents-title">Meus documentos</h2>
        </div>
        <span className="count">{documents.length}</span>
      </div>

      {isLoading && <p className="state-message">Carregando documentos...</p>}
      {!isLoading && documents.length === 0 && (
        <p className="state-message">Nenhum documento para este usuário.</p>
      )}
      {!isLoading && documents.length > 0 && (
        <ul className="document-list">
          {documents.map((document) => (
            <li key={document.id} className="document-row">
              <div className="document-details">
                <strong>{document.originalName}</strong>
                <span>{formatFileSize(document.size)} · {formatDate(document.uploadedAt)}</span>
              </div>
              <DownloadButton document={document} owner={owner} onError={onError} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}