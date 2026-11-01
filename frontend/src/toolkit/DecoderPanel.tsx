import { useState, type FormEvent } from "react";
import { useI18n } from "../i18n/I18nProvider";
import {
  base64Decode,
  base64Encode,
  crackJwtSecret,
  hexDecode,
  hexEncode,
  hmacSha256Base64Url,
  jwtDecode,
  jwtEncode,
  urlDecode,
  urlEncode,
  type JwtAlgorithm,
} from "./decoders";
import { JWT_SECRET_WORDLIST } from "./wordlist";

const OPERATIONS = {
  base64Decode,
  base64Encode,
  urlDecode,
  urlEncode,
  hexDecode,
  hexEncode,
  jwtDecode: (value: string) => {
    const { header, payload } = jwtDecode(value);
    return `${header}\n${payload}`;
  },
};

type Operation = keyof typeof OPERATIONS;

const OPERATION_NAMES = Object.keys(OPERATIONS) as Operation[];

function FieldLabel({ text }: { text: string }) {
  return <span className="kit__label">{text}</span>;
}

export function DecoderPanel({ seed }: { seed: string }) {
  const { t } = useI18n();
  const labels = t.toolkit.decoder;

  const [input, setInput] = useState(seed);
  const [operation, setOperation] = useState<Operation>("base64Decode");
  const [output, setOutput] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [signature, setSignature] = useState<string | null>(null);

  const [algorithm, setAlgorithm] = useState<JwtAlgorithm>("HS256");
  const [payload, setPayload] = useState('{"role":"admin"}');
  const [jwtSecret, setJwtSecret] = useState("");
  const [builtToken, setBuiltToken] = useState<string | null>(null);

  const [crackToken, setCrackToken] = useState("");
  const [crackResult, setCrackResult] = useState<string | null>(null);

  function transform(event: FormEvent) {
    event.preventDefault();
    try {
      setOutput(OPERATIONS[operation](input));
    } catch {
      setOutput(labels.invalid);
    }
  }

  async function sign(event: FormEvent) {
    event.preventDefault();
    setSignature(await hmacSha256Base64Url(secret, message));
  }

  async function buildToken(event: FormEvent) {
    event.preventDefault();
    try {
      setBuiltToken(await jwtEncode(algorithm, payload, jwtSecret));
    } catch {
      setBuiltToken(labels.invalid);
    }
  }

  async function crack(event: FormEvent) {
    event.preventDefault();
    const found = await crackJwtSecret(crackToken, JWT_SECRET_WORDLIST);
    setCrackResult(found === null ? labels.crackMissed : `${labels.crackFound} ${found}`);
  }

  return (
    <div className="kit__panel">
      <form className="kit__form" onSubmit={transform}>
        <h3 className="kit__section">{labels.transform}</h3>
        <label className="kit__field">
          <FieldLabel text={labels.input} />
          <textarea
            className="kit__input"
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
          />
        </label>
        <div className="kit__bar">
          <label className="kit__field kit__field--grow">
            <FieldLabel text={labels.operation} />
            <select
              className="kit__input"
              value={operation}
              onChange={(event) => setOperation(event.target.value as Operation)}
            >
              {OPERATION_NAMES.map((name) => (
                <option key={name} value={name}>
                  {labels.operations[name]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="kit__button">
            {labels.run}
          </button>
        </div>
        {output !== null && (
          <>
            <FieldLabel text={labels.output} />
            <pre className="kit__code" role="status">
              {output}
            </pre>
          </>
        )}
      </form>

      <form className="kit__form" onSubmit={sign}>
        <h3 className="kit__section">{labels.sign}</h3>
        <label className="kit__field">
          <FieldLabel text={labels.message} />
          <textarea
            className="kit__input"
            rows={2}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
          />
        </label>
        <div className="kit__bar">
          <label className="kit__field kit__field--grow">
            <FieldLabel text={labels.secret} />
            <input
              className="kit__input"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
            />
          </label>
          <button type="submit" className="kit__button">
            {labels.signRun}
          </button>
        </div>
        {signature !== null && (
          <pre className="kit__code" role="status">
            {signature}
          </pre>
        )}
      </form>

      <form className="kit__form" onSubmit={buildToken}>
        <h3 className="kit__section">{labels.jwt}</h3>
        <label className="kit__field">
          <FieldLabel text={labels.payload} />
          <textarea
            className="kit__input"
            rows={2}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
          />
        </label>
        <div className="kit__bar">
          <label className="kit__field">
            <FieldLabel text={labels.algorithm} />
            <select
              className="kit__input"
              value={algorithm}
              onChange={(event) => setAlgorithm(event.target.value as JwtAlgorithm)}
            >
              <option value="HS256">HS256</option>
              <option value="none">none</option>
            </select>
          </label>
          <label className="kit__field kit__field--grow">
            <FieldLabel text={labels.secret} />
            <input
              className="kit__input"
              value={jwtSecret}
              onChange={(event) => setJwtSecret(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
            />
          </label>
          <button type="submit" className="kit__button">
            {labels.jwtRun}
          </button>
        </div>
        {builtToken !== null && (
          <pre className="kit__code" role="status">
            {builtToken}
          </pre>
        )}
      </form>

      <form className="kit__form" onSubmit={crack}>
        <h3 className="kit__section">{labels.crack}</h3>
        <label className="kit__field">
          <FieldLabel text={labels.token} />
          <textarea
            className="kit__input"
            rows={2}
            value={crackToken}
            onChange={(event) => setCrackToken(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
          />
        </label>
        <button type="submit" className="kit__button">
          {labels.crackRun}
        </button>
        {crackResult !== null && (
          <pre className="kit__code" role="status">
            {crackResult}
          </pre>
        )}
      </form>
    </div>
  );
}
