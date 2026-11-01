import type { RoomSlug } from "./rooms";

export interface CodePair {
  vulnerable: string;
  corrected: string;
}

export const DEBRIEF_CODE: Partial<Record<RoomSlug, CodePair>> = {
  recon: {
    vulnerable: `@GetMapping("/internal/front-desk-terminal")
ResponseEntity<String> terminal() {
    return ResponseEntity.ok()
            .header("X-Kryptelia-Debug", deskToken())
            .body(TERMINAL);
}`,
    corrected: `@GetMapping("/internal/front-desk-terminal")
@PreAuthorize("hasRole('STAFF')")
ResponseEntity<String> terminal() {
    log.debug("Terminal opened by {}", user.id());
    return ResponseEntity.ok(TERMINAL);
}`,
  },
  checkout: {
    vulnerable: `@PostMapping("/purchase")
Receipt purchase(@RequestBody PurchaseOrder order) {
    if (order.price() > credits) {
        throw new InsufficientCredits();
    }
    return receiptFor(order.sku(), order.price());
}`,
    corrected: `@PostMapping("/purchase")
Receipt purchase(@RequestBody PurchaseOrder order) {
    Item item = catalog.find(order.sku())
            .orElseThrow(UnknownItem::new);
    if (item.price() > ledger.creditsOf(user.id())) {
        throw new InsufficientCredits();
    }
    return receiptFor(item.sku(), item.price());
}`,
  },
  cookiejar: {
    vulnerable: `Profile read(String cookie) {
    byte[] decoded = Base64.getDecoder()
            .decode(cookie);
    return json.readValue(decoded, Profile.class);
}`,
    corrected: `Profile read(String cookie) {
    String[] parts = cookie.split("\\\\.");
    byte[] expected = hmac.sign(parts[0]);
    byte[] received = decoder.decode(parts[1]);
    if (!MessageDigest.isEqual(expected, received)) {
        throw new TamperedCookie();
    }
    byte[] body = decoder.decode(parts[0]);
    return json.readValue(body, Profile.class);
}`,
  },
  idor: {
    vulnerable: `@GetMapping("/documents/{id}")
Document document(@PathVariable int id) {
    return documents.findById(id)
            .orElseThrow(NotFound::new);
}`,
    corrected: `@GetMapping("/documents/{id}")
Document document(@PathVariable int id) {
    return documents.findByIdAndOwner(id, user.id())
            .orElseThrow(NotFound::new);
}`,
  },
  sqli: {
    vulnerable: `List<Employee> search(String term) {
    String sql = "SELECT id, name, department "
            + "FROM employees WHERE name LIKE '%"
            + term + "%'";
    return jdbc.query(sql, employeeMapper);
}`,
    corrected: `List<Employee> search(String term) {
    return client.sql("""
            SELECT id, name, department
            FROM employees WHERE name LIKE :pattern
            """)
            .param("pattern", "%" + term + "%")
            .query(Employee.class)
            .list();
}`,
  },
  xss: {
    vulnerable: `@GetMapping("/inbox")
String inbox(@RequestParam String subject) {
    return PAGE.replace("__SUBJECT__", subject);
}`,
    corrected: `@GetMapping("/inbox")
String inbox(@RequestParam String subject) {
    String escaped = HtmlUtils.htmlEscape(subject);
    return PAGE.replace("__SUBJECT__", escaped);
}`,
  },
  traversal: {
    vulnerable: `@GetMapping("/download")
String download(@RequestParam String file) {
    return files.read(PUBLIC_DIRECTORY + file);
}`,
    corrected: `@GetMapping("/download")
String download(@RequestParam String file) {
    String path = normalize(PUBLIC_DIRECTORY + file);
    if (!path.startsWith(PUBLIC_DIRECTORY)) {
        throw new AccessDenied();
    }
    return files.read(path);
}`,
  },
  jwt: {
    vulnerable: `Badge read(String token) {
    String[] parts = token.split("\\\\.");
    if ("none".equalsIgnoreCase(algorithmOf(parts[0]))) {
        return badgeFrom(parts[1]);
    }
    verifySignature(parts, "kryptelia2019");
    return badgeFrom(parts[1]);
}`,
    corrected: `Badge read(String token) {
    String[] parts = token.split("\\\\.");
    if (!"HS256".equals(algorithmOf(parts[0]))) {
        throw new InvalidToken();
    }
    verifySignature(parts, properties.signingKey());
    return badgeFrom(parts[1]);
}`,
  },
  cmdinjection: {
    vulnerable: `String ping(String host) throws IOException {
    Process process = new ProcessBuilder(
            "sh", "-c", "ping -c 3 " + host).start();
    return outputOf(process);
}`,
    corrected: `String ping(String host) throws IOException {
    if (!VALID_HOST.matcher(host).matches()) {
        throw new InvalidHost();
    }
    Process process = new ProcessBuilder(
            "ping", "-c", "3", host).start();
    return outputOf(process);
}`,
  },
};
