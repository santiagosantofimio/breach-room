package dev.santiagosantofimio.breachroom.rooms.checkout;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/checkout")
public class CheckoutController {

    static final int STARTING_CREDITS = 100;
    static final String MASTER_KEY = "master-key";

    public record Item(String sku, String name, int price) {
    }

    public record OrderInstructions(String method, String path, PurchaseOrder example) {
    }

    public record Catalog(int credits, List<Item> items, OrderInstructions howToOrder) {
    }

    public record PurchaseOrder(String sku, Integer price) {
    }

    public record Receipt(String sku, int paid, int remainingCredits, String note) {
    }

    public record Refusal(String error, int credits) {
    }

    private static final List<Item> ITEMS = List.of(
            new Item("mug", "Commemorative layoff mug", 15),
            new Item("lanyard", "Lanyard, slightly used", 40),
            new Item(MASTER_KEY, "Master key to Accounting", 9_999));

    private static final OrderInstructions HOW_TO_ORDER = new OrderInstructions(
            "POST", "/api/rooms/checkout/purchase", new PurchaseOrder("mug", 15));

    private static final Map<String, Item> ITEMS_BY_SKU =
            ITEMS.stream().collect(Collectors.toMap(Item::sku, Function.identity()));

    private final FlagService flags;

    public CheckoutController(FlagService flags) {
        this.flags = flags;
    }

    @GetMapping("/catalog")
    public Catalog catalog() {
        return new Catalog(STARTING_CREDITS, ITEMS, HOW_TO_ORDER);
    }

    @PostMapping("/purchase")
    public ResponseEntity<?> purchase(
            @RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId,
            @RequestBody PurchaseOrder order) {
        if (order.sku() == null || order.price() == null || !ITEMS_BY_SKU.containsKey(order.sku())) {
            return ResponseEntity.badRequest().body(new Refusal("unknown_order", STARTING_CREDITS));
        }
        if (order.price() > STARTING_CREDITS) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body(new Refusal("insufficient_credits", STARTING_CREDITS));
        }
        String note = MASTER_KEY.equals(order.sku())
                ? flags.flagFor(sessionId, RoomSlug.CHECKOUT)
                : "Thank you for supporting Internal Morale.";
        return ResponseEntity.ok(new Receipt(order.sku(), order.price(), STARTING_CREDITS - order.price(), note));
    }
}
