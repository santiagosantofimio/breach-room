import type { RoomContent } from "../rooms/roomContent";
import type { RoomSlug } from "../rooms/rooms";

export const roomsEn: Partial<Record<RoomSlug, RoomContent>> = {
  recon: {
    letterhead: "Visitor sign-in sheet",
    story:
      "The receptionist left in 2019. The sign-in sheet stayed, along with a note saying the building is locked and your badge does not exist. Somewhere behind this desk is a terminal nobody meant to publish.",
    objective: "Find the page Reception asked search engines not to read, and take what it sends back.",
    hints: [
      "Polite crawlers check one well-known file before indexing a site. Kryptelia assumes everyone is polite.",
      "Open that file in the mini browser. Whatever it forbids is a map.",
      "The page body has nothing for you. Developers leave debugging aids where a page never shows them.",
    ],
    debrief: {
      happened:
        "You read robots.txt, followed the path it asked crawlers to avoid, and found a debug header left enabled in production.",
      why: "robots.txt is a request to well-behaved crawlers, not access control: listing a private path publishes it. The handler then relied on nobody arriving, so it kept a diagnostic header that hands internal values to any client.",
      detection:
        "Compare response headers against an allowlist in CI, crawl deployed routes for internal paths reachable without authentication, and alert on requests to anything listed under Disallow.",
      owasp: "A02:2025 Security Misconfiguration",
    },
  },
  checkout: {
    letterhead: "Purchase order, Internal Morale",
    story:
      "Internal Morale runs a shop where staff spend credits instead of receiving raises. The master key to Accounting sits on the top shelf at 9,999 credits. You were issued 100 credits and a warning.",
    objective: "Leave the shop with the master key.",
    hints: [
      "The catalog explains how an order is placed. Read what the client sends, not what the shelf says.",
      "Place an honest order in the repeater. Notice which fields the server simply believes.",
      "The server compares your credits against a number. Ask who supplied that number.",
    ],
    debrief: {
      happened:
        "You edited the price inside your own request and the server charged you that amount. The shop's rules were enforced by the shopper.",
      why: "The client is hostile territory: anything it sends can be changed. The handler used the submitted price as a fact, when the only trustworthy price is the one stored on the server. Validating the amount does not help if the amount itself is attacker-controlled.",
      detection:
        "Reconcile orders against catalog prices, alert when a charged amount differs from the listed one, and review any request schema that carries values the server already knows.",
      owasp: "A06:2025 Insecure Design",
    },
  },
  cookiejar: {
    letterhead: "Locker assignment, Human Resources",
    story:
      "Lockers are assigned through a cookie HR describes as a trust-based identity solution. The executive locker opens for admins. You are, at this stage of your career, a guest.",
    objective: "Open the executive locker.",
    hints: [
      "Visit the locker once. A profile will be issued to your cookie jar.",
      "That value is not random. Run it through the decoder.",
      "Nothing in the request proves who wrote that value. Change what it says, encode it again, and return.",
    ],
    debrief: {
      happened:
        "Your profile was Base64-encoded JSON with no signature. You rewrote your own role and the server accepted it.",
      why: "Base64 is an encoding, not protection: anyone can reverse it. Without a signature the server cannot tell a value it issued from one the client invented, so the client ends up choosing its own permissions.",
      detection:
        "Inspect cookies for decodable structured data, reject unsigned session state in code review, and log role changes that have no matching administrative action.",
      owasp: "A08:2025 Software or Data Integrity Failures",
    },
  },
  idor: {
    letterhead: "Records request, The Archive",
    story:
      "The Archive keeps every record Kryptelia hopes nobody will request. You may read your own file. The clerk verifies this by assuming you would not lie.",
    objective: "Read the Director's exit interview notes.",
    hints: [
      "Open your inbox and read your own document. Notice how it is addressed.",
      "Your contract mentions how staff records are numbered.",
      "The number in the path is the only thing the server looks at. The Director was here first.",
    ],
    debrief: {
      happened:
        "You changed one number in the path and read someone else's document. The server checked that the record existed, never that it was yours.",
      why: "Being authenticated says who you are, not what you may touch. Every object lookup needs an ownership or permission check, because identifiers are guessable, enumerable, and always under the client's control.",
      detection:
        "Add tests where one user requests another user's objects, flag handlers that fetch by identifier without a principal, and alert on one session reading many sequential identifiers.",
      owasp: "A01:2025 Broken Access Control",
    },
  },
};
