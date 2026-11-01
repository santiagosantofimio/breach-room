export const en = {
  language: {
    legend: "Language of correspondence",
    en: "English",
    es: "Español",
  },
  envelope: {
    company: "Kryptelia Systems",
    tagline: "Your data. Our systems. Your fault.",
    title: "Breach Room",
    intro:
      "You were misrouted into Kryptelia's internal network. Nine departments stand between you and the exit. Each has one real vulnerability and no budget to fix it.",
    handling: "Do not seal. Do not bend. Do not leave.",
    previousRecipient: "Contractor 1042",
    fields: [
      { label: "To", value: "Contractor 1043" },
      { label: "From", value: "Human Resources" },
      { label: "Re", value: "Your continued presence" },
    ],
    holesNote: "Holes provided so you can confirm you are still inside.",
  },
  route: {
    label: "Routing record",
    department: "Department",
    received: "Received",
    rooms: {
      recon: "Reception",
      checkout: "Internal Shop",
      cookiejar: "Locker Room",
      idor: "Archive",
      sqli: "Directory",
      xss: "Mailbox",
      traversal: "Backups",
      jwt: "Access Control",
      cmdinjection: "Diagnostics",
    },
  },
  mailroom: {
    heading: "While you wait",
    queue: "In queue",
    waitNote: "The mailroom naps when idle. The first delivery takes about a minute.",
    lines: [
      "Mailroom notified of your arrival.",
      "Mailroom is at lunch.",
      "Mailroom back from lunch. Morale unchanged.",
      "Request for your envelope filed in triplicate.",
      "Your envelope was located behind the photocopier.",
      "Still behind the photocopier. Facilities has been informed.",
      "Facilities opened a ticket about the ticket.",
      "The ticket about the ticket has been escalated to you.",
    ],
    stamps: ["Pending", "Escalated", "See attached", "Not my dept.", "Re-filed", "Pending again"],
    ready: "Envelope located. Cleared for routing.",
    open: "Unwind the string",
    undeliverableStamp: "Undeliverable",
    undeliverable: "The mailroom stopped answering. We keep trying. You can also come back later.",
    refused: "The mailroom refused your envelope.",
    retry: "File it again",
  },
  memo: {
    title: "Memorandum",
    paragraphs: [
      "It has come to our attention that you are inside our network. Company policy forbids this, and also forbids leaving.",
      "To exit, pass through all nine departments. Each one hides a flag behind a real vulnerability. File the flag and the next door opens. Please do not explain to Legal how you did it.",
      "After each door, Compliance will show you what went wrong and how it should have been written. Try to look surprised.",
      "Your toolkit will be issued at Reception.",
    ],
    closedStamp: "Closed",
    closed: "Reception is closed for carpet replacement. Facilities apologizes for nothing. Rooms open in the next release.",
  },
  footer: {
    fiction: "Kryptelia Systems is fictional. Breach Room is a game by",
    author: "Santiago Santofimio",
  },
};

export type Dictionary = typeof en;
