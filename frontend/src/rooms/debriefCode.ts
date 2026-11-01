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
};
