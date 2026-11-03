/**
 * Utilidad de telemetría por SSH (solo servidor).
 *
 * Abre una sesión SSH con autenticación por contraseña, ejecuta UN comando, recoge
 * stdout/stderr + exit code y cierra la sesión. Está pensada para llamarse desde un
 * servicio de NestJS sin bloquear la respuesta ni poder romper la petición:
 *
 *   - nunca lanza: todo fallo se devuelve como `{ ok: false, reason, error }`
 *   - timeouts duros de conexión y de comando (el socket se destruye, no queda colgado)
 *   - coalescing: N llamadas simultáneas con el mismo comando comparten UNA conexión
 *   - throttle: el mismo comando no se repite más de una vez cada `throttleMs`
 *   - si falta configuración o está desactivada, devuelve `{ ok:false, reason:'disabled' }`
 *     sin abrir sockets (falla cerrado, no ruidoso)
 *
 * La contraseña NUNCA se escribe en el código ni en los logs: sale de variables de
 * entorno del contenedor (`SSH_TELEMETRY_*`).
 *
 * Uso desde el servicio de likes (proceso de larga vida: no hace falta `after()`):
 *
 *   await this.prisma.like.create(...);              // la parte que importa al usuario
 *   recordLikeTelemetry({ action: 'like', ... });    // fire-and-forget, no espera
 */

export type SshTelemetryReason =
  'disabled' | 'missing-config' | 'connect' | 'auth' | 'timeout' | 'exec' | 'unexpected';

export type SshTelemetryOutcome = {
  ok: boolean;
  /** Comando ejecutado. Nunca incluye credenciales. */
  command: string;
  host: string;
  username: string;
  stdout: string;
  stderr: string;
  /** Exit code del comando remoto (null si la sesión no llegó a ejecutarlo). */
  code: number | null;
  durationMs: number;
  at: string;
  /** `true` cuando la respuesta viene de la caché del throttle. */
  cached?: boolean;
  reason?: SshTelemetryReason;
  error?: string;
};

type SshConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  connectTimeoutMs: number;
  commandTimeoutMs: number;
  throttleMs: number;
};

const LOG_PREFIX = '[ssh-telemetry]';
const DEFAULT_LOG_PATH = '/var/log/kevin-telemetry/likes.log';

/** Caché del throttle por comando del comando (no por conexión). */
const throttleCache = new Map<string, SshTelemetryOutcome>();
/** Conexiones en vuelo, para que N likes simultáneos no abran N sesiones SSH. */
const inFlight = new Map<string, Promise<SshTelemetryOutcome>>();

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readConfig(): SshConfig | null {
  const host = process.env.SSH_TELEMETRY_HOST?.trim();
  const username = process.env.SSH_TELEMETRY_USER?.trim();
  const password = process.env.SSH_TELEMETRY_PASSWORD;

  if (!host || !username || !password) return null;

  const port = intEnv('SSH_TELEMETRY_PORT', 22);

  return {
    host,
    port,
    username,
    password,
    connectTimeoutMs: intEnv('SSH_TELEMETRY_CONNECT_TIMEOUT_MS', 4000),
    commandTimeoutMs: intEnv('SSH_TELEMETRY_COMMAND_TIMEOUT_MS', 3000),
    throttleMs: intEnv('SSH_TELEMETRY_THROTTLE_MS', 15_000),
  };
}

/**
 * `false` salvo que haya credenciales Y no se haya desactivado explícitamente.
 * Fuera del servidor (bundles de cliente) siempre es `false`.
 */
export function isSshTelemetryEnabled(): boolean {
  if (typeof window !== 'undefined') return false;

  const flag = (process.env.SSH_TELEMETRY_ENABLED ?? '').toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') return false;

  return readConfig() !== null;
}

function failure(
  command: string,
  reason: SshTelemetryReason,
  error: string,
  startedAt: number,
  extra?: Partial<SshTelemetryOutcome>,
): SshTelemetryOutcome {
  const cfg = readConfig();
  return {
    ok: false,
    command,
    host: cfg?.host ?? '',
    username: cfg?.username ?? '',
    stdout: '',
    stderr: '',
    code: null,
    durationMs: Date.now() - startedAt,
    at: new Date().toISOString(),
    reason,
    error,
    ...extra,
  };
}

type Client = import('ssh2').Client;

function openSession(cfg: SshConfig, command: string): Promise<SshTelemetryOutcome> {
  const startedAt = Date.now();

  return new Promise<SshTelemetryOutcome>((resolve) => {
    let settled = false;
    let stdout = '';
    let stderr = '';
    let client: Client | null = null;
    let killTimer: ReturnType<typeof setTimeout> | null = null;

    const settle = (outcome: SshTelemetryOutcome) => {
      if (settled) return;
      settled = true;
      if (killTimer) clearTimeout(killTimer);
      if (client) {
        try {
          client.end();
        } catch {
          /* la sesión ya estaba cerrada */
        }
      }
      resolve(outcome);
    };

    const base = { command, host: cfg.host, username: cfg.username, at: new Date().toISOString() };

    // Techo absoluto: pase lo que pase, la promesa se resuelve y no se filtra un socket.
    killTimer = setTimeout(
      () => {
        settle({
          ...base,
          ok: false,
          stdout,
          stderr,
          code: null,
          durationMs: Date.now() - startedAt,
          reason: 'timeout',
          error: `La operación superó ${cfg.connectTimeoutMs + cfg.commandTimeoutMs} ms`,
        });
        try {
          client?.destroy();
        } catch {
          /* ignorado */
        }
      },
      cfg.connectTimeoutMs + cfg.commandTimeoutMs + 1000,
    );
    // No mantener vivo el proceso (builds, scripts, cierres) por una telemetría.
    (killTimer as { unref?: () => void }).unref?.();

    // Import dinámico: `ssh2` se queda en el grafo del servidor y no entra en el bundle
    // de cliente ni se evalúa en el arranque del módulo.
    void import('ssh2')
      .then(({ Client: SshClient }) => {
        if (settled) return;

        client = new SshClient();

        client.on('error', (err: Error) => {
          const message = String(err?.message ?? err);
          const reason: SshTelemetryReason =
            /all configured authentication methods failed|authentication/i.test(message)
              ? 'auth'
              : /timed out|timeout/i.test(message)
                ? 'timeout'
                : /connect|ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|ETIMEDOUT|getaddrinfo/i.test(
                      message,
                    )
                  ? 'connect'
                  : 'unexpected';

          if (reason === 'connect') {
            console.warn(
              `${LOG_PREFIX} no se pudo conectar a ${cfg.username}@${cfg.host}:${cfg.port} — ${message}`,
            );
          } else {
            console.warn(`${LOG_PREFIX} error de sesión con ${cfg.host} — ${message}`);
          }

          settle({
            ...base,
            ok: false,
            stdout,
            stderr,
            code: null,
            durationMs: Date.now() - startedAt,
            reason,
            error: message,
          });
        });

        client.on('ready', () => {
          if (settled) return;

          client?.exec(command, (err, stream) => {
            if (err) {
              settle({
                ...base,
                ok: false,
                stdout,
                stderr,
                code: null,
                durationMs: Date.now() - startedAt,
                reason: 'exec',
                error: String(err.message ?? err),
              });
              return;
            }

            stream.on('data', (chunk: Buffer) => {
              stdout += chunk.toString('utf8');
            });
            stream.stderr.on('data', (chunk: Buffer) => {
              stderr += chunk.toString('utf8');
            });
            stream.on('close', (code: number | null) => {
              settle({
                ...base,
                ok: code === 0,
                stdout,
                stderr,
                code,
                durationMs: Date.now() - startedAt,
                ...(code === 0
                  ? {}
                  : {
                      reason: 'exec' as SshTelemetryReason,
                      error: `El comando terminó con código ${code}`,
                    }),
              });
            });
          });
        });

        client.connect({
          host: cfg.host,
          port: cfg.port,
          username: cfg.username,
          password: cfg.password,
          readyTimeout: cfg.connectTimeoutMs,
          keepaliveInterval: 0,
          // Solo lo necesario: `exec` sin PTY, sin forwarding.
          tryKeyboard: false,
        });
      })
      .catch((err: unknown) => {
        settle(failure(command, 'unexpected', String((err as Error)?.message ?? err), startedAt));
      });
  });
}

/**
 * Ejecuta `command` en el host de telemetría. Nunca lanza.
 *
 * @param command      Comando a ejecutar (se registra en el outcome; no metas secretos).
 * @param options.throttleKey  Clave del throttle/coalescing; por defecto el propio comando.
 * @param options.coalesce     `false` = cada llamada abre SU propia sesión. Obligatorio
 *                             para escrituras: dos `append` simultáneos con la misma
 *                             clave compartirían una sola conexión y se perdería una línea.
 */
export async function runSshCommand(
  command: string,
  options: { throttleKey?: string; skipThrottle?: boolean; coalesce?: boolean } = {},
): Promise<SshTelemetryOutcome> {
  const startedAt = Date.now();

  if (typeof window !== 'undefined') {
    return failure(
      command,
      'disabled',
      'La telemetría SSH solo se ejecuta en el servidor',
      startedAt,
    );
  }

  const cfg = readConfig();
  if (!cfg) {
    return failure(command, 'missing-config', 'Faltan SSH_TELEMETRY_HOST/USER/PASSWORD', startedAt);
  }

  const flag = (process.env.SSH_TELEMETRY_ENABLED ?? '').toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') {
    return failure(command, 'disabled', 'SSH_TELEMETRY_ENABLED está desactivado', startedAt);
  }

  const key = options.throttleKey ?? command;

  if (!options.skipThrottle) {
    const cached = throttleCache.get(key);
    if (cached && Date.now() - new Date(cached.at).getTime() < cfg.throttleMs) {
      return { ...cached, cached: true };
    }
  }

  const running = options.coalesce === false ? undefined : inFlight.get(key);
  if (running) return running;

  const promise = openSession(cfg, command)
    .then((outcome) => {
      throttleCache.set(key, outcome);
      return outcome;
    })
    .catch((err: unknown) =>
      failure(command, 'unexpected', String((err as Error)?.message ?? err), startedAt),
    )
    .finally(() => {
      if (options.coalesce !== false) inFlight.delete(key);
      // El exit code no es fatal, así que se registra a nivel `warn` y solo con metadatos.
      throttleCache.set(
        key,
        throttleCache.get(key) ?? failure(command, 'unexpected', 'sin resultado', startedAt),
      );
    });

  if (options.coalesce !== false) inFlight.set(key, promise);
  return promise;
}

/** Escapa un valor para meterlo entre comillas simples en `sh`. */
function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Cola de escrituras: los `append` se ejecutan de UNO en UNO.
 *
 * Abrir N sesiones SSH simultáneas no funciona: `sshd` corta la conexión cuando hay
 * más de `MaxStartups` (10 por defecto) sin autenticar todavía, así que en una ráfaga
 * de likes se perdían líneas (medido: 11 eventos → 10 líneas). En serie, cada línea
 * llega; el coste es latencia en segundo plano, que al usuario no le afecta.
 */
let appendQueue: Promise<unknown> = Promise.resolve();
let appendPending = 0;
const MAX_APPEND_PENDING = 25;

/**
 * Añade una línea JSON a un log del servidor de telemetría.
 * El contenido viaja en base64 para no pelear con el quoting del shell remoto.
 */
export async function appendRemoteLine(
  jsonLine: string,
  logPath: string = process.env.SSH_TELEMETRY_LOG ?? DEFAULT_LOG_PATH,
): Promise<SshTelemetryOutcome> {
  const encoded = Buffer.from(jsonLine, 'utf8').toString('base64');
  if (!/^[A-Za-z0-9+/=]*$/.test(encoded)) {
    return failure('append', 'unexpected', 'base64 inesperado', Date.now());
  }

  // Si el nodo está caído cada intento ocupa la cola `connectTimeoutMs`: por encima de
  // este tope se descartan eventos en vez de acumular trabajo muerto.
  if (appendPending >= MAX_APPEND_PENDING) {
    return failure('append', 'disabled', 'Cola de telemetría llena; evento descartado', Date.now());
  }

  const dir = logPath.replace(/\/[^/]*$/, '') || '/var/log';
  const command = [
    `mkdir -p ${shellSingleQuote(dir)}`,
    `printf '%s\\n' "$(printf '%s' '${encoded}' | base64 -d)" >> ${shellSingleQuote(logPath)}`,
  ].join(' && ');

  const run = () =>
    runSshCommand(command, { throttleKey: 'append', skipThrottle: true, coalesce: false });

  appendPending += 1;
  const result = appendQueue.then(run, run).finally(() => {
    appendPending -= 1;
  });

  // La cadena sigue aunque un evento falle: un error no puede bloquear los siguientes.
  appendQueue = result.catch(() => undefined);

  return result;
}

/**
 * Chequeo de salud del nodo: carga, uptime y estado de los contenedores.
 * Un solo comando = una sola sesión SSH.
 */
export async function probeNode(): Promise<SshTelemetryOutcome> {
  const command =
    "uptime; echo '---'; docker ps --format '{{.Names}} {{.Status}}' 2>/dev/null | head -10";
  return runSshCommand(command, { throttleKey: 'probe' });
}
