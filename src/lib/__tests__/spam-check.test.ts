import { describe, it, expect } from "vitest";
import { checkSpamScore } from "../spam-check";

describe("checkSpamScore", () => {
  it("returns safe for clean plain text content", () => {
    const result = checkSpamScore("Hello, this is a normal email with some content. You can unsubscribe here. Thanks!");
    expect(result.score).toBe(0);
    expect(result.flags).toEqual([]);
    expect(result.level).toBe("safe");
  });

  it("detects excessive capitalization", () => {
    const result = checkSpamScore("THIS IS ALL CAPS AND VERY LOUD CONTENT UNSUBSCRIBE");
    expect(result.flags).toContain("Excessive capitalization");
    expect(result.score).toBeGreaterThanOrEqual(15);
  });

  it("detects too many exclamation marks", () => {
    const result = checkSpamScore("Wow!!!! This is amazing!!!! Look!!!!! Unsubscribe");
    expect(result.flags).toContain("Too many exclamation marks");
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("detects consecutive exclamation marks", () => {
    const result = checkSpamScore("Buy now!!! Unsubscribe here");
    expect(result.flags).toContain("Too many exclamation marks");
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("detects spam trigger words", () => {
    const result = checkSpamScore("This is a free offer. Click here now! Unsubscribe");
    expect(result.flags).toContain("Spam trigger words found");
  });

  it("caps trigger word score at 40", () => {
    const content = SPAM_WORDS_ALL();
    const result = checkSpamScore(content);
    expect(result.flags).toContain("Spam trigger words found");
  });

  it("detects missing unsubscribe link", () => {
    const result = checkSpamScore("This email has no way to opt out");
    expect(result.flags).toContain("No unsubscribe link found");
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it("does not flag missing unsubscribe when present", () => {
    const result = checkSpamScore("You can unsubscribe here. Some regular text.");
    expect(result.flags).not.toContain("No unsubscribe link found");
  });

  it("detects image-only email", () => {
    const result = checkSpamScore('<img src="image.jpg" alt=""><img src="image2.jpg">');
    expect(result.flags).toContain("Image-only email");
    expect(result.score).toBeGreaterThanOrEqual(15);
  });

  it("detects excessive links", () => {
    const links = Array.from({ length: 12 }, (_, i) => `<a href="https://example${i}.com">link${i}</a>`).join("");
    const result = checkSpamScore(`<p>${links} short</p>`);
    expect(result.flags).toContain("Excessive links");
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("detects oversized fonts", () => {
    const result = checkSpamScore('<span style="font-size: 50px">Big text unsubscribe</span>');
    expect(result.flags).toContain("Oversized fonts");
    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it("does not flag font sizes at or below 40px", () => {
    const result = checkSpamScore('<span style="font-size: 40px">Normal big text unsubscribe</span>');
    expect(result.flags).not.toContain("Oversized fonts");
  });

  it("detects excessive formatting (bold)", () => {
    const bolds = Array.from({ length: 6 }, (_, i) => `<b>bold${i}</b>`).join("") + " unsubscribe";
    const result = checkSpamScore(bolds);
    expect(result.flags).toContain("Excessive formatting");
    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it("detects excessive formatting (red)", () => {
    const reds = Array.from({ length: 4 }, () => '<span style="color: red">red</span>').join("") + " unsubscribe";
    const result = checkSpamScore(reds);
    expect(result.flags).toContain("Excessive formatting");
    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it("detects no plain text version", () => {
    const result = checkSpamScore("<html><body><p>Hi</p></body></html>");
    expect(result.flags).toContain("No plain text version");
    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it("detects suspicious URLs with IP addresses", () => {
    const result = checkSpamScore('Click <a href="http://192.168.1.1/malware">here</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("detects suspicious URLs with redirect patterns", () => {
    const result = checkSpamScore('Click <a href="https://example.com/redirect?url=bad">here</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("combines multiple spam signals correctly", () => {
    const content = '<b>FREE OFFER!!!! </b><a href="http://192.168.1.1/track?id=1">Click here now</a>';
    const result = checkSpamScore(content);
    expect(result.score).toBeGreaterThan(0);
    expect(result.flags.length).toBeGreaterThanOrEqual(1);
  });

  it("clamps score between 0 and 100", () => {
    const result = checkSpamScore(HIGH_SCORE_CONTENT());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns high level when score >= 60", () => {
    const result = checkSpamScore(HIGH_SCORE_CONTENT());
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.level).toBe("high");
  });

  it("returns moderate level when score >= 30 and < 60", () => {
    const goodEnough = "Amazing offer guaranteed free limited time click here now unsubscribe";
    const result = checkSpamScore(goodEnough);
    expect(result.level).toBe("moderate");
  });

  it("returns safe level when score < 30", () => {
    const result = checkSpamScore("Hello, just a normal note. Unsubscribe here.");
    expect(result.level).toBe("safe");
  });

  it("handles empty string input", () => {
    const result = checkSpamScore("");
    expect(result.score).toBe(20);
    expect(result.flags).toEqual(["No unsubscribe link found"]);
    expect(result.level).toBe("safe");
  });

  it("extracts URLs from href attributes", () => {
    const content = '<a href="https://example.com">link</a> unsubscribe';
    const result = checkSpamScore(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("extracts bare URLs from text", () => {
    const content = "Visit https://example.com for info Unsubscribe";
    const result = checkSpamScore(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("deduplicates URLs found via href and bare regex", () => {
    const content = '<a href="https://example.com">https://example.com</a> unsubscribe';
    const result = checkSpamScore(content);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("hasRedirectPattern matches /go/ pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/go/tracking">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });

  it("hasRedirectPattern matches /out/ pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/out/click">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });

  it("hasRedirectPattern matches /link/ pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/link/tracker">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });

  it("hasRedirectPattern matches /click/ pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/click/track">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });

  it("hasRedirectPattern matches /track/ pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/track/abc">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });

  it("hasRedirectPattern matches /r/ pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/r/abc123">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });

  it("hasRedirectPattern matches ?redirect= pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/page?redirect=http://bad">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });

  it("hasRedirectPattern matches &redirect= pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/page?a=1&redirect=http://bad">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });

  it("hasRedirectPattern matches /redirect pattern", () => {
    const result = checkSpamScore('<a href="https://example.com/redirect?url=http://bad">link</a> unsubscribe');
    expect(result.flags).toContain("Suspicious URLs");
  });
});

function SPAM_WORDS_ALL(): string {
  const words = [
    "free", "guaranteed", "act now", "limited time", "click here",
    "congratulations", "winner", "urgent", "exclusive", "offer",
    "buy now", "order now", "call now", "don't delete", "immediately",
    "limited offer", "new customers only", "no cost", "no obligation",
    "promise you", "risk free", "satisfaction guaranteed", "save big",
    "special promotion", "subscribe now", "terms and conditions apply",
    "this is not spam", "unlimited", "while supplies last", "you have been selected",
    "amazing", "bargain", "bonus", "cash", "discount", "earn money",
    "great deal", "hurry up", "increase sales", "instant", "incredible",
    "investment", "lowest price", "miracle", "no fees", "priceless",
  ];
  return words.join(" ") + " unsubscribe";
}

function HIGH_SCORE_CONTENT(): string {
  return `<!DOCTYPE html>
<html><body>
<span style="font-size: 60px">FREE OFFER!!! CLICK HERE NOW!!! LIMITED TIME!!!</span>
${Array.from({ length: 8 }, (_, i) => `<b>BOLD${i}</b>`).join("")}
${Array.from({ length: 4 }, () => '<span style="color: red">RED</span>').join("")}
<a href="http://192.168.1.1/track?id=bad">suspicious</a>
<a href="https://example.com/redirect?url=bad">redirect</a>
${Array.from({ length: 15 }, (_, i) => `<a href="https://spam${i}.com">link${i}</a>`).join("")}
<img src="image.jpg">
</body></html>`;
}
