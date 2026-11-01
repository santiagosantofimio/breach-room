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
  sqli: {
    letterhead: "Employee search, Human Resources",
    story:
      "The Directory lets anyone look up a colleague by name. An intern wrote it in one afternoon and it has never needed maintenance, which Facilities considers proof that it is secure. Behind it sits a table nobody is meant to read.",
    objective: "Read the access token kept in the vault.",
    hints: [
      "Search for a lone single quote and read what the Directory says back.",
      "Your input is being pasted into the statement. Three columns come back, so anything you add must return three as well.",
      "One query's results can be appended to another's. The table you want has an id, a label and a secret.",
    ],
    debrief: {
      happened:
        "You closed the string literal and appended a second query, so the database returned vault rows alongside the employees.",
      why: "Concatenation turns data into code: the database cannot tell which part came from the developer. Placeholders send the statement and the values separately, so input can never change the query's structure.",
      detection:
        "Flag concatenated SQL in static analysis, alert on database syntax errors from public endpoints, and watch request logs for UNION and metadata tables.",
      owasp: "A05:2025 Injection",
    },
  },
  xss: {
    letterhead: "Webmail search, Information Technology",
    story:
      "Kryptelia Webmail has one working feature: it repeats your search back to you. IT calls this personalization. The preview below opens a live copy of the page.",
    objective: "Make the webmail page run a script of your own and raise an alert box.",
    hints: [
      "Search for something and find where your words land in the page.",
      "Try input that is not only text. Does the page treat angle brackets as data or as markup?",
      "Several tags can run code without a script tag, and a script tag works too. The page only has to call alert.",
    ],
    debrief: {
      happened:
        "The page wrote your search term into its HTML without escaping it, so the browser parsed your input as markup and ran it.",
      why: "When developer markup and attacker input arrive in one response, the browser cannot tell them apart. Output must be encoded for the context it lands in, and a Content Security Policy limits the damage when encoding is missed.",
      detection:
        "Scan templates for unescaped output, collect CSP violation reports, and test reflected parameters with harmless markers.",
      owasp: "A05:2025 Injection",
    },
  },
  traversal: {
    letterhead: "Restore request, Information Technology",
    story:
      "The Backups portal serves files from one public folder. IT moved the encryption key somewhere safe, then wrote down where it went in a file in that same public folder.",
    objective: "Download the encryption key.",
    hints: [
      "Read the portal's index, then read the readme it lists.",
      "The file parameter is glued onto a folder path. Consider what a path can do besides go deeper.",
      "Count the folders between the public directory and the root, then climb that many.",
    ],
    debrief: {
      happened:
        "You added parent directory segments to the file name. The server resolved them after joining the path, which walked you out of the public folder.",
      why: "Joining input onto a base path does not keep the result inside it. The path must be normalized and then checked against the base directory, or files should be looked up through a list of known identifiers.",
      detection:
        "Alert on literal or encoded parent segments in parameters, run services without access outside their folder, and test file parameters with traversal payloads.",
      owasp: "A01:2025 Broken Access Control",
    },
  },
};
