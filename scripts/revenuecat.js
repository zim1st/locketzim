/*
 * Locket Zim: local replacement for the two RevenueCat hooks in the original
 * profile. Preserves that profile's Gold response mapping for compatibility.
 * This changes a client response; it does not purchase or grant server access.
 * See NOTICE.md for the original behavior and sources used for comparison.
 */
(function () {
    "use strict";
    function object(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }
    if (typeof $request === "undefined") return $done({});
    var url = $request.url || "";
    if (!/^https:\/\/api\.revenuecat\.com\/v1\/(?:receipts|subscribers\/[^/?]+)(?:\?|$)/.test(url)) return $done({});
    var headers = $request.headers || {};
    var ua = "";
    Object.keys(headers).forEach(function (key) {
        if (key.toLowerCase() === "user-agent") ua = String(headers[key]);
    });
    if (!/locket/i.test(ua)) return $done({});
    if (typeof $response === "undefined") {
        var requestHeaders = Object.assign({}, headers);
        Object.keys(requestHeaders).forEach(function (key) {
            if (/^(x-revenuecat-etag|if-none-match|if-modified-since)$/i.test(key)) delete requestHeaders[key];
        });
        return $done({ headers: requestHeaders });
    }
    var rawStatus = $response.statusCode || $response.status;
    if (rawStatus !== undefined && !/(?:^|\s)200(?:\s|$)/.test(String(rawStatus))) return $done({});
    try {
        var body = JSON.parse($response.body);
        if (!object(body) || !object(body.subscriber)) return $done({});
        var subscriber = body.subscriber;
        if (subscriber.subscriptions != null && !object(subscriber.subscriptions)) return $done({});
        if (subscriber.entitlements != null && !object(subscriber.entitlements)) return $done({});
        subscriber.subscriptions = subscriber.subscriptions || {};
        subscriber.entitlements = subscriber.entitlements || {};
        var product = "com.ohoang7.premium.yearly";
        var expires = "2099-12-18T01:04:17Z";
        var purchase = "2024-07-28T01:04:17Z";
        // An already active Gold entitlement should retain its original metadata.
        var existing = subscriber.entitlements.Gold;
        if (object(existing) && (existing.expires_date === null || Date.parse(existing.expires_date) > Date.now())) {
            return $done({});
        }
        if (!Object.prototype.hasOwnProperty.call(subscriber.subscriptions, product)) {
            subscriber.subscriptions[product] = {
                is_sandbox: false,
                ownership_type: "PURCHASED",
                billing_issues_detected_at: null,
                period_type: "normal",
                expires_date: expires,
                grace_period_expires_date: null,
                unsubscribe_detected_at: null,
                original_purchase_date: "2024-07-28T01:04:18Z",
                purchase_date: purchase,
                store: "app_store"
            };
        }
        subscriber.entitlements.Gold = {
            grace_period_expires_date: null,
            purchase_date: purchase,
            product_identifier: product,
            expires_date: expires
        };
        var responseHeaders = Object.assign({}, $response.headers || {});
        Object.keys(responseHeaders).forEach(function (key) {
            if (/^(content-length|content-encoding|etag)$/i.test(key)) delete responseHeaders[key];
        });
        return $done({ headers: responseHeaders, body: JSON.stringify(body) });
    } catch (_) {
        return $done({});
    }
})();
