import type { RoomForm } from "../rooms/roomContent";
import type { RoomSlug } from "../rooms/rooms";

type FormLayout = "ledger" | "lockers" | "slip" | "index" | "message" | "tapes" | "badge" | "checklist";

const LAYOUTS: Record<RoomSlug, FormLayout> = {
  recon: "ledger",
  checkout: "ledger",
  cookiejar: "lockers",
  idor: "slip",
  sqli: "index",
  xss: "message",
  traversal: "tapes",
  jwt: "badge",
  cmdinjection: "checklist",
};

interface RoomFormBlockProps {
  slug: RoomSlug;
  letterhead: string;
  form: RoomForm;
  receivedLabel: string;
  stamp: string | null;
}

function Ledger({ form, caption }: { form: RoomForm; caption: string }) {
  return (
    <table className="form__ledger">
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          {form.columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {form.rows.map((row) => (
          <tr key={row.join()}>
            {row.map((cell, index) => (
              <td key={index}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Lockers({ form }: { form: RoomForm }) {
  return (
    <ol className="form__lockers">
      {form.rows.map(([number, tenant]) => (
        <li key={number}>
          <span className="form__locker-number">{number}</span>
          <span>{tenant}</span>
        </li>
      ))}
    </ol>
  );
}

function Pairs({ form }: { form: RoomForm }) {
  return (
    <dl className="form__pairs">
      {form.rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CardIndex({ form }: { form: RoomForm }) {
  return (
    <ol className="form__index">
      {form.rows.map(([name, department]) => (
        <li key={name}>
          <span className="form__tab" aria-hidden="true">
            {name?.at(0)}
          </span>
          <span className="form__index-name">{name}</span>
          <span>{department}</span>
        </li>
      ))}
    </ol>
  );
}

function Message({ form }: { form: RoomForm }) {
  const [sender, subject, ...details] = form.rows;

  return (
    <div className="form__message">
      <p className="form__subject">{subject?.[1]}</p>
      <p className="form__sender">
        {sender?.[0]}: {sender?.[1]}
      </p>
      <ul className="form__meta">
        {details.map(([label, value]) => (
          <li key={label}>
            {label}: {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tapes({ form }: { form: RoomForm }) {
  return (
    <ol className="form__tapes">
      {form.rows.map(([folder, lastBackup, status]) => (
        <li key={folder}>
          <span className="form__tape-label">{folder}</span>
          <span className="form__tape-reels" aria-hidden="true" />
          <span>
            {form.columns[1]}: {lastBackup}
          </span>
          <span>{status}</span>
        </li>
      ))}
    </ol>
  );
}

function Badge({ form }: { form: RoomForm }) {
  return (
    <div className="form__badge">
      <span className="form__photo" aria-hidden="true" />
      <Pairs form={form} />
    </div>
  );
}

function Checklist({ form }: { form: RoomForm }) {
  return (
    <ul className="form__checklist">
      {form.rows.map(([task, state]) => (
        <li key={task}>
          <span className="form__tick" aria-hidden="true">
            {state}
          </span>
          <span>{task}</span>
        </li>
      ))}
    </ul>
  );
}

function FormBody({ layout, form, caption }: { layout: FormLayout; form: RoomForm; caption: string }) {
  switch (layout) {
    case "ledger":
      return <Ledger form={form} caption={caption} />;
    case "lockers":
      return <Lockers form={form} />;
    case "index":
      return <CardIndex form={form} />;
    case "badge":
      return <Badge form={form} />;
    case "checklist":
      return <Checklist form={form} />;
    case "message":
      return <Message form={form} />;
    case "tapes":
      return <Tapes form={form} />;
    case "slip":
      return <Pairs form={form} />;
  }
}

export function RoomFormBlock({ slug, letterhead, form, receivedLabel, stamp }: RoomFormBlockProps) {
  const layout = LAYOUTS[slug];

  return (
    <section className="form" data-layout={layout} aria-label={letterhead}>
      <header className="form__head">
        <span>{letterhead}</span>
        <span className="form__reference">{form.reference}</span>
      </header>
      <FormBody layout={layout} form={form} caption={letterhead} />
      <p className="form__received">
        <span>{receivedLabel}</span>
        {stamp !== null && (
          <span className="stamp" aria-hidden="true">
            {stamp}
          </span>
        )}
      </p>
    </section>
  );
}
