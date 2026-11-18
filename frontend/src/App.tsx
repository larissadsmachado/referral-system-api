import { useState } from 'react';
import type { FormEvent } from 'react';

type Screen = 'signup' | 'scoreboard';
type ApiRecord = Record<string, unknown>;

interface Customer {
  id: string | null;
}

interface ReportEntry {
  customerId: string;
  totalIndications: number;
}

interface FormErrors {
  name?: string;
  email?: string;
  parentCustomerId?: string;
  form?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')
  .trim()
  .replace(/\/+$/, '');

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessages(payload: unknown): string[] {
  if (typeof payload === 'string') {
    return [payload];
  }

  if (!isRecord(payload)) {
    return [];
  }

  const message = payload.message;
  if (typeof message === 'string') {
    return [message];
  }
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string');
  }

  return [];
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return text;
    }
    throw error;
  }
}

function getReturnedId(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  for (const key of ['id', 'customer_id', '_id']) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getFieldErrors(
  messages: string[],
  status: number,
  hasReferralCode: boolean,
): FormErrors {
  const errors: FormErrors = {};
  const allMessages = messages.join(' ');
  const normalized = allMessages.toLocaleLowerCase('pt-BR');
  const emailIssue = /e-?mail|email/.test(normalized);
  const referralIssue =
    /indica|parent|customer|referr|código|codigo/.test(normalized) ||
    (status === 400 && hasReferralCode && !emailIssue);

  if (emailIssue) {
    errors.email = /duplic|exist|cadastrad|taken|already/.test(normalized)
      ? 'Esse e-mail já está cadastrado.'
      : messages[0] || 'Confira o e-mail informado.';
  }

  if (referralIssue) {
    errors.parentCustomerId =
      status === 400
        ? 'Não encontramos esse código. Confira o ID de quem te indicou.'
        : messages[0] || 'Confira o código de indicação.';
  }

  if (!emailIssue && !referralIssue && status === 409) {
    errors.email = 'Esse e-mail já está cadastrado.';
  }

  return errors;
}

function formatRequestError(status: number, action: string, messages: string[]) {
  if (status === 404) {
    return `A API ainda não encontrou ${action}. Confira se a rota já foi implementada.`;
  }

  return messages[0] || `Não foi possível ${action}. Tente novamente.`;
}

function parseReports(payload: unknown): ReportEntry[] {
  if (!Array.isArray(payload)) {
    throw new Error('A resposta de GET /reports não veio no formato esperado.');
  }

  return payload.map((item, index) => {
    if (
      !isRecord(item) ||
      (typeof item.customer_id !== 'string' &&
        typeof item.customer_id !== 'number') ||
      !String(item.customer_id).trim() ||
      typeof item.total_indications !== 'number' ||
      !Number.isFinite(item.total_indications)
    ) {
      throw new Error(
        `O item ${index + 1} do relatório veio fora do formato esperado.`,
      );
    }

    return {
      customerId: String(item.customer_id),
      totalIndications: item.total_indications,
    };
  });
}

function App() {
  const [screen, setScreen] = useState<Screen>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [parentCustomerId, setParentCustomerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);
  const [registeredWithReferral, setRegisteredWithReferral] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reports, setReports] = useState<ReportEntry[] | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [copiedCustomerId, setCopiedCustomerId] = useState('');

  async function submitCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    setCreatedCustomer(null);
    setRegisteredWithReferral(false);

    const hasReferralCode = Boolean(parentCustomerId.trim());
    const body: {
      name: string;
      email: string;
      parent_customer_id?: string;
    } = {
      name: name.trim(),
      email: email.trim(),
    };
    if (parentCustomerId.trim()) {
      body.parent_customer_id = parentCustomerId.trim();
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await readResponseBody(response);

      if (!response.ok) {
        const messages = getErrorMessages(payload);
        const fieldErrors = getFieldErrors(
          messages,
          response.status,
          hasReferralCode,
        );
        if (Object.keys(fieldErrors).length > 0) {
          setFormErrors(fieldErrors);
        } else {
          setFormErrors({
            form: formatRequestError(
              response.status,
              'cadastrar seu perfil',
              messages,
            ),
          });
        }
        return;
      }

      setCreatedCustomer({ id: getReturnedId(payload) });
      setRegisteredWithReferral(hasReferralCode);
      setName('');
      setEmail('');
      setParentCustomerId('');
    } catch (error) {
      setFormErrors({
        form:
          error instanceof TypeError
            ? 'Não conseguimos conectar à API. Verifique se ela está no ar e tente de novo.'
            : 'Ocorreu um erro ao ler a resposta da API. Tente novamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function loadReports() {
    if (reportsLoading) {
      return;
    }

    setReportsLoading(true);
    setReportsError('');

    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      const payload = await readResponseBody(response);
      if (!response.ok) {
        setReportsError(
          formatRequestError(
            response.status,
            'carregar o placar',
            getErrorMessages(payload),
          ),
        );
        return;
      }

      setReports(parseReports(payload));
    } catch (error) {
      setReports(null);
      setReportsError(
        error instanceof TypeError
          ? 'Não conseguimos conectar à API. Verifique se ela está no ar e tente de novo.'
          : error instanceof Error
            ? error.message
            : 'Não foi possível ler o relatório da API.',
      );
    } finally {
      setReportsLoading(false);
    }
  }

  async function copyText(value: string, source: 'own' | 'report') {
    try {
      await navigator.clipboard.writeText(value);
      if (source === 'own') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } else {
        setCopiedCustomerId(value);
        window.setTimeout(() => setCopiedCustomerId(''), 1800);
      }
    } catch {
      if (source === 'own') {
        setFormErrors({
          form: 'Não foi possível copiar. Selecione e copie o código manualmente.',
        });
      } else {
        setReportsError(
          'Não foi possível copiar o ID. Selecione e copie o código manualmente.',
        );
      }
    }
  }

  function showScoreboard() {
    setScreen('scoreboard');
    void loadReports();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#inicio"
          aria-label="Indica e Conta, início"
          onClick={(event) => {
            event.preventDefault();
            setScreen('signup');
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            i<span>+</span>
          </span>
          <span className="brand-name">
            INDICA<span>E CONTA</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <button
            className={screen === 'signup' ? 'nav-link active' : 'nav-link'}
            type="button"
            aria-current={screen === 'signup' ? 'page' : undefined}
            onClick={() => setScreen('signup')}
          >
            Cadastro
          </button>
          <button
            className={screen === 'scoreboard' ? 'nav-link active' : 'nav-link'}
            type="button"
            aria-current={screen === 'scoreboard' ? 'page' : undefined}
            onClick={showScoreboard}
          >
            Placar
            <span className="nav-dot" aria-hidden="true" />
          </button>
        </nav>
      </header>

      <div className="content-grid" id="inicio">
        <section className="intro" aria-labelledby="page-title">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            BOAS CONEXÕES VALEM MAIS
          </div>
          <h1 id="page-title">
            Indicação boa
            <br />
            <span>é assim:</span>
            <br />
            todo mundo
            <br />
            <span className="highlight">conta.</span>
          </h1>
          <p>
            Convide alguém, compartilhe seu código e acompanhe quem chegou por
            você.
          </p>
          <div className="intro-stamp" aria-hidden="true">
            <span>GENTE</span>
            <span>INDICA</span>
            <span className="stamp-arrow">↘</span>
          </div>
          <div className="steps" aria-label="Como funciona">
            <div className="step">
              <span className="step-number">01</span>
              <span>Faça seu cadastro</span>
            </div>
            <div className="step">
              <span className="step-number">02</span>
              <span>Compartilhe seu código</span>
            </div>
            <div className="step">
              <span className="step-number">03</span>
              <span>Acompanhe o placar</span>
            </div>
          </div>
        </section>

        <section className="workspace" aria-live="polite">
          {screen === 'signup' ? (
            <div className="panel signup-panel">
              <div className="panel-topline">
                <span className="panel-index">01 / CADASTRO</span>
                <span className="status-pill">
                  <span className="status-light" />
                  SUA VEZ
                </span>
              </div>

              {createdCustomer ? (
                <div className="success-state">
                  <div className="success-icon" aria-hidden="true">
                    ✓
                  </div>
                  <p className="kicker">TÁ NA LISTA</p>
                  <h2>Cadastro feito!</h2>
                  {createdCustomer.id ? (
                    <>
                      <p className="success-copy">
                        Esse é seu código. Copia e manda pra geral.
                      </p>
                      <div className="code-card">
                        <span className="code-label">SEU CÓDIGO</span>
                        <code>{createdCustomer.id}</code>
                      </div>
                      <button
                        className={copied ? 'button button-lime copied' : 'button button-lime'}
                        type="button"
                        onClick={() => {
                          if (createdCustomer.id) {
                            void copyText(createdCustomer.id, 'own');
                          }
                        }}
                      >
                        {copied ? 'Copiado!' : 'Copiar meu código'}
                        <span aria-hidden="true">{copied ? '✓' : '↗'}</span>
                      </button>
                    </>
                  ) : (
                    <p className="success-copy">
                      A API confirmou seu cadastro, mas não retornou um ID para
                      compartilhar.
                    </p>
                  )}
                  {registeredWithReferral && (
                    <p className="async-note" role="status">
                      A indicação foi enviada. O placar pode levar alguns
                      segundos para atualizar.
                    </p>
                  )}
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setCreatedCustomer(null)}
                  >
                    Cadastrar outra pessoa
                  </button>
                </div>
              ) : (
                <>
                  <div className="panel-heading">
                    <p className="kicker">SEU PRÓXIMO PASSO</p>
                    <h2>Bora indicar?</h2>
                    <p>Começa com você. Leva só um minutinho.</p>
                  </div>

                  <form className="signup-form" onSubmit={submitCustomer}>
                    <div className="field">
                      <label htmlFor="name">Seu nome</label>
                      <input
                        id="name"
                        name="name"
                        autoComplete="name"
                        placeholder="Como a gente te chama?"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        aria-invalid={Boolean(formErrors.name)}
                        aria-describedby={
                          formErrors.name ? 'name-error' : undefined
                        }
                        required
                      />
                      {formErrors.name && (
                        <span className="field-error" id="name-error">
                          {formErrors.name}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="email">Seu e-mail</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="voce@email.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={Boolean(formErrors.email)}
                        aria-describedby={
                          formErrors.email ? 'email-error' : undefined
                        }
                        required
                      />
                      {formErrors.email && (
                        <span className="field-error" id="email-error">
                          {formErrors.email}
                        </span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="parentCustomerId">
                        Quem te indicou? <span>OPCIONAL</span>
                      </label>
                      <input
                        id="parentCustomerId"
                        name="parent_customer_id"
                        autoComplete="off"
                        placeholder="Cole o código de quem indicou"
                        value={parentCustomerId}
                        onChange={(event) =>
                          setParentCustomerId(event.target.value)
                        }
                        aria-invalid={Boolean(formErrors.parentCustomerId)}
                        aria-describedby={
                          formErrors.parentCustomerId
                            ? 'referral-error'
                            : 'referral-hint'
                        }
                      />
                      {formErrors.parentCustomerId ? (
                        <span className="field-error" id="referral-error">
                          {formErrors.parentCustomerId}
                        </span>
                      ) : (
                        <span className="field-hint" id="referral-hint">
                          Tem um código? Coloca aqui.
                        </span>
                      )}
                    </div>

                    {formErrors.form && (
                      <p className="form-error" role="alert">
                        <span aria-hidden="true">!</span>
                        {formErrors.form}
                      </p>
                    )}

                    <button
                      className="button button-pink"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? 'Enviando...' : 'Criar meu cadastro'}
                      <span aria-hidden="true">
                        {submitting ? <span className="spinner" /> : '↗'}
                      </span>
                    </button>
                    <p className="form-footnote">
                      Ao continuar, seus dados serão enviados para a API.
                    </p>
                  </form>
                </>
              )}
            </div>
          ) : (
            <div className="panel scoreboard-panel">
              <div className="panel-topline">
                <span className="panel-index">02 / PLACAR</span>
                <span className="scoreboard-spark" aria-hidden="true">
                  ✳
                </span>
              </div>
              <div className="panel-heading scoreboard-heading">
                <p className="kicker">QUEM TÁ MOVIMENTANDO</p>
                <h2>Placar de indicações</h2>
                <p>O número atualiza assim que a indicação é confirmada.</p>
              </div>

              <button
                className="button button-outline refresh-button"
                type="button"
                onClick={() => void loadReports()}
                disabled={reportsLoading}
              >
                {reportsLoading ? (
                  <>
                    Atualizando <span className="spinner" />
                  </>
                ) : (
                  <>
                    Atualizar placar <span aria-hidden="true">↻</span>
                  </>
                )}
              </button>

              {reportsError && (
                <div className="report-error" role="alert">
                  <span aria-hidden="true">!</span>
                  <p>{reportsError}</p>
                </div>
              )}

              {reportsLoading && !reports && !reportsError ? (
                <div className="report-loading" role="status">
                  <span className="spinner" />
                  Buscando dados reais da API...
                </div>
              ) : reports && reports.length === 0 && !reportsError ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true">
                    ↗
                  </div>
                  <h3>Ainda não rolou nenhuma indicação.</h3>
                  <p>Compartilha seu código e dá o primeiro passo.</p>
                </div>
              ) : reports && reports.length > 0 && !reportsError ? (
                <ol className="report-list">
                  {reports.map((entry, index) => (
                    <li
                      className="report-row"
                      key={`${entry.customerId}-${index}`}
                    >
                      <span className="report-rank">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="report-person">
                        <span className="report-name">
                          ID {shortenId(entry.customerId)}
                        </span>
                        <button
                          className="copy-id"
                          type="button"
                          aria-label={`Copiar ID completo ${entry.customerId}`}
                          onClick={() =>
                            void copyText(entry.customerId, 'report')
                          }
                        >
                          {copiedCustomerId === entry.customerId
                            ? 'Copiado!'
                            : 'Copiar ID'}
                        </button>
                      </span>
                      <span className="report-count">
                        <strong>{entry.totalIndications}</strong>
                        <span>
                          {entry.totalIndications === 1 ? 'indicação' : 'indicações'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
              <p className="report-footnote">
                Os dados vêm direto da API. As indicações podem levar alguns
                segundos para aparecer.
              </p>
            </div>
          )}
        </section>
      </div>

      <footer className="footer">
        <span>INDICA E CONTA <span className="footer-dot">●</span> 2026</span>
        <span>UMA BOA INDICAÇÃO MUDA TUDO.</span>
      </footer>
    </main>
  );
}

function shortenId(id: string) {
  if (id.length <= 14) {
    return id;
  }
  return `${id.slice(0, 7)}…${id.slice(-5)}`;
}

export default App;
