import { useState } from 'react';
import type { FormEvent } from 'react';

type Screen = 'signup' | 'scoreboard' | 'customers';
type ApiRecord = Record<string, unknown>;

interface Customer {
  id: string | null;
}

interface RegisteredCustomer {
  customerId: string;
  name: string;
  email: string;
  parentCustomerId: string | null;
  createdAt: string;
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
      ? 'Esse e-mail já está registrado na Corte.'
      : messages[0] || 'Confira o e-mail informado.';
  }

  if (referralIssue) {
    errors.parentCustomerId =
      status === 400
        ? 'Não encontramos esse código na mesa. Confira o ID do seu aliado.'
        : messages[0] || 'Confira o código de indicação.';
  }

  if (!emailIssue && !referralIssue && status === 409) {
    errors.email = 'Esse e-mail já está registrado na Corte.';
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

function parseCustomers(payload: unknown): RegisteredCustomer[] {
  if (!Array.isArray(payload)) {
    throw new Error('A resposta de GET /customers não veio no formato esperado.');
  }

  return payload.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`O cadastro ${index + 1} veio fora do formato esperado.`);
    }

    const id = getReturnedId(item);
    if (!id) {
      throw new Error(`O cadastro ${index + 1} não possui um ID válido.`);
    }

    return {
      customerId: id,
      name: typeof item.name === 'string' ? item.name : 'Agente Desconhecido',
      email: typeof item.email === 'string' ? item.email : '—',
      parentCustomerId:
        typeof item.parent_customer_id === 'string' && item.parent_customer_id.trim()
          ? item.parent_customer_id.trim()
          : null,
      createdAt:
        typeof item.created_at === 'string' ? item.created_at : '',
    };
  });
}

const COUP_ROLES = [
  { role: 'Assassino', suit: '♠', color: 'crimson' },
  { role: 'Duque', suit: '♦', color: 'gold' },
  { role: 'Condessa', suit: '♥', color: 'crimson' },
  { role: 'Capitão', suit: '♣', color: 'gold' },
  { role: 'Embaixador', suit: '♠', color: 'gold' },
] as const;

function getCoupCardRole(index: number) {
  return COUP_ROLES[index % COUP_ROLES.length];
}

function getCoupInfluenceTitle(count: number): { role: string; suit: string } {
  if (count >= 8) return { role: 'Duque Soberano', suit: '♦' };
  if (count >= 5) return { role: 'Mestre Assassino', suit: '♠' };
  if (count >= 3) return { role: 'Condessa', suit: '♥' };
  if (count >= 2) return { role: 'Capitão', suit: '♣' };
  return { role: 'Embaixador', suit: '♠' };
}

function formatDate(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DaggerEmblem() {
  return (
    <svg
      className="dagger-svg"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M32 6L38 28L32 56L26 28L32 6Z"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M20 26H44"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="17" r="2.5" fill="currentColor" />
    </svg>
  );
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

  const [customers, setCustomers] = useState<RegisteredCustomer[] | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState('');

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
              'revelar sua carta',
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
      const [reportsResponse, customersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/reports`),
        fetch(`${API_BASE_URL}/customers`).catch(() => null),
      ]);
      const payload = await readResponseBody(reportsResponse);
      if (!reportsResponse.ok) {
        setReportsError(
          formatRequestError(
            reportsResponse.status,
            'carregar o placar',
            getErrorMessages(payload),
          ),
        );
        return;
      }

      if (customersResponse && customersResponse.ok) {
        const customersPayload = await readResponseBody(customersResponse);
        try {
          setCustomers(parseCustomers(customersPayload));
        } catch {
          // Mantém placar funcionando mesmo se listagem falhar
        }
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

  async function loadCustomers() {
    if (customersLoading) {
      return;
    }

    setCustomersLoading(true);
    setCustomersError('');

    try {
      const response = await fetch(`${API_BASE_URL}/customers`);
      const payload = await readResponseBody(response);
      if (!response.ok) {
        setCustomersError(
          formatRequestError(
            response.status,
            'carregar as cartas da mesa',
            getErrorMessages(payload),
          ),
        );
        return;
      }

      setCustomers(parseCustomers(payload));
    } catch (error) {
      setCustomers(null);
      setCustomersError(
        error instanceof TypeError
          ? 'Não conseguimos conectar à API. Verifique se ela está no ar e tente de novo.'
          : error instanceof Error
            ? error.message
            : 'Não foi possível carregar os cadastros da API.',
      );
    } finally {
      setCustomersLoading(false);
    }
  }

  async function copyText(value: string, source: 'own' | 'list') {
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

  function showCustomers() {
    setScreen('customers');
    void loadCustomers();
  }

  function useAsReferrer(id: string) {
    setParentCustomerId(id);
    setCreatedCustomer(null);
    setScreen('signup');
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
            <DaggerEmblem />
          </span>
          <span className="brand-name">
            INDICA &amp; CONTA
            <span>A CORTE · INTRIGAS &amp; ALIANÇAS</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Navegação principal">
          <button
            className={screen === 'signup' ? 'nav-link active' : 'nav-link'}
            type="button"
            aria-current={screen === 'signup' ? 'page' : undefined}
            onClick={() => setScreen('signup')}
          >
            ♠ Nova Carta
          </button>
          <button
            className={screen === 'customers' ? 'nav-link active' : 'nav-link'}
            type="button"
            aria-current={screen === 'customers' ? 'page' : undefined}
            onClick={showCustomers}
          >
            ♦ Cartas na Mesa (Cadastros)
          </button>
          <button
            className={screen === 'scoreboard' ? 'nav-link active' : 'nav-link'}
            type="button"
            aria-current={screen === 'scoreboard' ? 'page' : undefined}
            onClick={showScoreboard}
          >
            ♛ A Corte (Placar)
          </button>
        </nav>
      </header>

      <div className="content-grid" id="inicio">
        <section className="intro" aria-labelledby="page-title">
          <div className="eyebrow">
            <span className="suit-icon">♠</span>
            JOGO DE INFLUÊNCIA · QUEM É O ASSASSINO?
          </div>

          <h1 id="page-title">
            Na mesa de
            <br />
            intrigas, cada
            <br />
            <span className="highlight">aliança conta.</span>
          </h1>

          <p>
            Entre para a Corte, receba seu selo secreto e recrute infiltrados.
            Acumule moedas de influência antes que alguém dê um{' '}
            <strong>Golpe de Estado (Coup)</strong>.
          </p>

          <div className="hero-actions">
            <button
              className="button button-gold-outline"
              type="button"
              onClick={showCustomers}
            >
              <span>🃏 Ver todas as cartas (Cadastros feitos)</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="role-deck-preview" aria-label="Regras da Corte">
            <div className="mini-card">
              <span className="mini-card-suit">♠</span>
              <div>
                <strong>I. Assuma uma Identidade</strong>
                <span>Cadastre seu nome na mesa e receba sua carta secreta.</span>
              </div>
            </div>
            <div className="mini-card">
              <span className="mini-card-suit crimson">♥</span>
              <div>
                <strong>II. Forme Alianças Ocultas</strong>
                <span>Compartilhe seu código com seus cúmplices e infiltrados.</span>
              </div>
            </div>
            <div className="mini-card">
              <span className="mini-card-suit">♦</span>
              <div>
                <strong>III. Domine o Tesouro da Corte</strong>
                <span>Cada indicação vale moedas de influência no Placar Real.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="workspace" aria-live="polite">
          {screen === 'signup' && (
            <div className="playing-card">
              <div className="card-corner top-left" aria-hidden="true">
                <span>♠</span>
                <small>A</small>
              </div>
              <div className="card-corner bottom-right" aria-hidden="true">
                <span>♠</span>
                <small>A</small>
              </div>

              <div className="card-inner">
                {createdCustomer ? (
                  <div className="success-state">
                    <div className="wax-seal" aria-hidden="true">
                      <DaggerEmblem />
                    </div>
                    <p className="kicker">CARTA REVELADA · IDENTIDADE SELADA</p>
                    <h2>Você está na Mesa!</h2>
                    {createdCustomer.id ? (
                      <>
                        <p className="success-copy">
                          Este é o seu código secreto de influência. Entregue aos
                          seus aliados para que entrem sob sua proteção:
                        </p>
                        <div className="code-card">
                          <span className="code-label">SELO DO AGENTE (SEU CÓDIGO)</span>
                          <code>{createdCustomer.id}</code>
                        </div>
                        <button
                          className="button button-crimson"
                          type="button"
                          onClick={() => {
                            if (createdCustomer.id) {
                              void copyText(createdCustomer.id, 'own');
                            }
                          }}
                        >
                          {copied ? 'Selo copiado!' : 'Copiar meu código secreto'}
                          <span aria-hidden="true">{copied ? '✓' : '🗝'}</span>
                        </button>
                      </>
                    ) : (
                      <p className="success-copy">
                        Sua entrada na Corte foi confirmada!
                      </p>
                    )}

                    {registeredWithReferral && (
                      <p className="async-note" role="status">
                        🪙 Moeda de influência enviada ao seu mentor! O tesouro da
                        Corte será atualizado em instantes.
                      </p>
                    )}

                    <div className="success-actions">
                      <button
                        className="button button-dark"
                        type="button"
                        onClick={showCustomers}
                      >
                        <span>🃏 Ver todos os cadastros feitos</span>
                        <span aria-hidden="true">→</span>
                      </button>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setCreatedCustomer(null)}
                      >
                        Infiltrar outro jogador
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="panel-heading">
                      <span className="role-tag">CARTA DE PERSONAGEM · O ASSASSINO</span>
                      <h2>Entrar na Mesa</h2>
                      <p>Revele seu nome ou codinome para receber sua carta na Corte.</p>
                    </div>

                    <form className="signup-form" onSubmit={submitCustomer}>
                      <div className="field">
                        <label htmlFor="name">Nome do Jogador / Agente</label>
                        <input
                          id="name"
                          name="name"
                          autoComplete="name"
                          placeholder="Como será conhecido na Corte?"
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
                        <label htmlFor="email">E-mail Confidencial</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="agente@corte.com"
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
                          Quem te infiltrou? (Código do Aliado) <span>Opcional</span>
                        </label>
                        <input
                          id="parentCustomerId"
                          name="parent_customer_id"
                          autoComplete="off"
                          placeholder="Cole o código do jogador que te indicou"
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
                            Dica: Veja os jogadores suspeitos em &ldquo;Cartas na Mesa&rdquo;.
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
                        className="button button-crimson"
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting ? 'Sacando carta...' : 'Sacar Minha Carta (Cadastrar)'}
                        <span aria-hidden="true">
                          {submitting ? <span className="spinner" /> : '🗡'}
                        </span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {screen === 'customers' && (
            <div className="playing-card">
              <div className="card-corner top-left" aria-hidden="true">
                <span>♦</span>
                <small>K</small>
              </div>
              <div className="card-corner bottom-right" aria-hidden="true">
                <span>♦</span>
                <small>K</small>
              </div>

              <div className="card-inner">
                <div className="panel-heading">
                  <div className="heading-row">
                    <div>
                      <span className="role-tag">DOSSIÊ DE SUSPEITOS · CADASTROS</span>
                      <h2>Cartas na Mesa</h2>
                    </div>
                    {customers && (
                      <span className="count-pill">
                        {customers.length} {customers.length === 1 ? 'carta' : 'cartas'}
                      </span>
                    )}
                  </div>
                  <p>
                    Todos os jogadores cadastrados. Descubra quem infiltrou quem
                    ou use a carta de alguém como seu aliado.
                  </p>
                </div>

                <div className="panel-toolbar">
                  <button
                    className="button button-dark refresh-button"
                    type="button"
                    onClick={() => void loadCustomers()}
                    disabled={customersLoading}
                  >
                    {customersLoading ? 'Investigando...' : '↻ Atualizar mesa'}
                  </button>
                  <button
                    className="button button-crimson refresh-button"
                    type="button"
                    onClick={() => setScreen('signup')}
                  >
                    + Nova Carta
                  </button>
                </div>

                {customersError && (
                  <div className="report-error" role="alert">
                    <span aria-hidden="true">!</span>
                    <p>{customersError}</p>
                  </div>
                )}

                {customersLoading && !customers && !customersError ? (
                  <div className="report-loading" role="status">
                    <span className="spinner" />
                    Revelando cartas na mesa...
                  </div>
                ) : customers && customers.length === 0 && !customersError ? (
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true">
                      🃏
                    </div>
                    <h3>Nenhuma carta na mesa ainda</h3>
                    <p>Seja o primeiro a sacar uma carta e iniciar a partida.</p>
                  </div>
                ) : customers && customers.length > 0 && !customersError ? (
                  <ul className="customer-list">
                    {customers.map((member, index) => {
                      const cardRole = getCoupCardRole(index);
                      const referrer = member.parentCustomerId
                        ? customers.find((c) => c.customerId === member.parentCustomerId)
                        : null;
                      return (
                        <li className="suspect-card" key={member.customerId}>
                          <div className="suspect-card-header">
                            <div
                              className={`suspect-suit ${cardRole.color}`}
                              aria-hidden="true"
                            >
                              {cardRole.suit}
                            </div>
                            <div className="customer-info">
                              <div className="suspect-name-row">
                                <strong className="customer-name">{member.name}</strong>
                                <span className="suspect-role-badge">
                                  {cardRole.role}
                                </span>
                              </div>
                              <span className="customer-email">{member.email}</span>
                            </div>
                          </div>

                          <div className="customer-meta">
                            <span>
                              Selo (ID): <code>{member.customerId}</code>
                            </span>
                            {member.parentCustomerId && (
                              <span className="customer-referrer-tag">
                                Cúmplice de:{' '}
                                <strong>
                                  {referrer
                                    ? referrer.name
                                    : shortenId(member.parentCustomerId)}
                                </strong>
                              </span>
                            )}
                            {member.createdAt && (
                              <span className="customer-date">
                                Na mesa desde {formatDate(member.createdAt)}
                              </span>
                            )}
                          </div>

                          <div className="customer-actions">
                            <button
                              className="chip-button"
                              type="button"
                              onClick={() => void copyText(member.customerId, 'list')}
                            >
                              {copiedCustomerId === member.customerId
                                ? '✓ Código copiado!'
                                : 'Copiar código'}
                            </button>
                            <button
                              className="chip-button chip-button-gold"
                              type="button"
                              onClick={() => useAsReferrer(member.customerId)}
                            >
                              🗡 Aliar-se a esta carta
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
          )}

          {screen === 'scoreboard' && (
            <div className="playing-card">
              <div className="card-corner top-left" aria-hidden="true">
                <span>♥</span>
                <small>Q</small>
              </div>
              <div className="card-corner bottom-right" aria-hidden="true">
                <span>♥</span>
                <small>Q</small>
              </div>

              <div className="card-inner">
                <div className="panel-heading">
                  <span className="role-tag">TESOURO CENTRAL · INFLUÊNCIA</span>
                  <h2>A Corte (Placar)</h2>
                  <p>
                    Quem acumulou mais aliados e moedas de influência na mesa.
                  </p>
                </div>

                <div className="panel-toolbar">
                  <button
                    className="button button-dark refresh-button"
                    type="button"
                    onClick={() => void loadReports()}
                    disabled={reportsLoading}
                  >
                    {reportsLoading ? 'Contando moedas...' : '↻ Atualizar placar'}
                  </button>
                  <button
                    className="button button-dark refresh-button"
                    type="button"
                    onClick={showCustomers}
                  >
                    🃏 Ver todos os cadastros
                  </button>
                </div>

                {reportsError && (
                  <div className="report-error" role="alert">
                    <span aria-hidden="true">!</span>
                    <p>{reportsError}</p>
                  </div>
                )}

                {reportsLoading && !reports && !reportsError ? (
                  <div className="report-loading" role="status">
                    <span className="spinner" />
                    Consultando influências da Corte...
                  </div>
                ) : reports && reports.length === 0 && !reportsError ? (
                  <div className="empty-state">
                    <div className="empty-icon" aria-hidden="true">
                      🪙
                    </div>
                    <h3>Nenhuma aliança formada ainda</h3>
                    <p>Escolha uma carta da mesa e faça a primeira indicação.</p>
                  </div>
                ) : reports && reports.length > 0 && !reportsError ? (
                  <ol className="report-list">
                    {reports.map((entry, index) => {
                      const matchedCustomer = customers?.find(
                        (c) => c.customerId === entry.customerId,
                      );
                      const displayName =
                        matchedCustomer?.name ||
                        `Agente #${shortenId(entry.customerId)}`;
                      const influence = getCoupInfluenceTitle(entry.totalIndications);

                      return (
                        <li
                          className="report-row"
                          key={`${entry.customerId}-${index}`}
                        >
                          <span className="report-rank">
                            {index === 0 ? '♛' : `${index + 1}º`}
                          </span>
                          <div className="report-person">
                            <div className="report-title-line">
                              <span className="report-name">{displayName}</span>
                              <span className="rank-badge">
                                {influence.suit} {influence.role}
                              </span>
                            </div>
                            <div className="report-person-actions">
                              <button
                                className="copy-id"
                                type="button"
                                onClick={() =>
                                  void copyText(entry.customerId, 'list')
                                }
                              >
                                {copiedCustomerId === entry.customerId
                                  ? '✓ Copiado'
                                  : 'Copiar código'}
                              </button>
                              <button
                                className="copy-id"
                                type="button"
                                onClick={() => useAsReferrer(entry.customerId)}
                              >
                                Aliar-se a este jogador
                              </button>
                            </div>
                          </div>
                          <span className="report-count">
                            <strong>🪙 {entry.totalIndications}</strong>
                            <span>
                              {entry.totalIndications === 1
                                ? 'influência'
                                : 'influências'}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>

      <footer className="footer">
        <span>♠ ♥ INDICA &amp; CONTA · EDIÇÃO COUP (A CORTE) ♦ ♣</span>
        <span>BLEFE, DESCUBRA O ASSASSINO E CONSTRUA SUA INFLUÊNCIA.</span>
      </footer>
    </main>
  );
}

function shortenId(id: string) {
  if (id.length <= 12) {
    return id;
  }
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default App;
