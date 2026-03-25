import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/auth';
import { listGeneratedFiles, readDashboardState } from '@/lib/store';

export default async function UploadPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const authenticated = await isAdminAuthenticated();
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : '';

  if (!authenticated) {
    return (
      <div className="login-shell page">
        <div className="auth-card">
          <h1>Área restrita de upload</h1>
          {error ? <div className="error-box" style={{ marginTop: 18 }}>{error}</div> : null}
          <form action="/api/login" method="post" className="form-grid">
            <div className="field"><label htmlFor="user">Usuário</label><input id="user" name="user" type="text" required /></div>
            <div className="field"><label htmlFor="password">Senha</label><input id="password" name="password" type="password" required /></div>
            <button className="primary-btn" type="submit">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  const state = readDashboardState();
  const files = listGeneratedFiles();
  const success = typeof params.success === 'string' ? params.success : '';

  return (
    <div className="upload-shell page">
      <div className="up-card">
        <div className="up-title">Dashboard Email Marketing</div>
        <div className="muted">
          O upload ficou isolado nesta rota administrativa. Depois que a base é salva no servidor, a home passa a carregar o estado persistido automaticamente.
        </div>

        {success ? <div className="success-box" style={{ marginTop: 18 }}>{success}</div> : null}
        {error ? <div className="error-box" style={{ marginTop: 18 }}>{error}</div> : null}

        <div className="upload-box">
          <form action="/api/upload" method="post" encType="multipart/form-data" className="form-grid">
            <div className="field">
              <label htmlFor="file">Arquivo CSV, XLSX ou XLS</label>
              <input id="file" name="file" type="file" accept=".csv,.xlsx,.xls" required />
            </div>
            <button className="primary-btn" type="submit">Salvar nova base</button>
          </form>
        </div>

        <div className="small-list">
          <div className="file-line"><span>Base atual</span><strong>{state ? state.fileName : 'nenhuma base ainda'}</strong></div>
          <div className="file-line"><span>Linhas processadas</span><strong>{state ? state.rowCount.toLocaleString('pt-BR') : '0'}</strong></div>
          <div className="file-line"><span>Home pública</span><strong>/</strong></div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
          <Link className="secondary-btn" href="/">Ir para dashboard</Link>
          <form action="/api/logout" method="post"><button className="secondary-btn" type="submit">Sair</button></form>
        </div>

        <div style={{ marginTop: 22 }}>
          <div className="muted" style={{ marginBottom: 10 }}>Arquivos gerados para download</div>
          <div className="small-list">
            {files.length === 0 ? (
              <div className="file-line"><span>Nenhum arquivo gerado</span><strong>ok</strong></div>
            ) : (
              files.map((file) => (
                <div className="file-line" key={file.name}>
                  <span>{file.name}</span>
                  <a href={`/generated/${encodeURIComponent(file.name)}`} download>baixar</a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
