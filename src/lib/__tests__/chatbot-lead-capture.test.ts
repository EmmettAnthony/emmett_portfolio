import { describe, it, expect, vi, beforeEach } from "vitest";

const mockChatLeadFindUnique = vi.fn();
const mockChatConversationFindUnique = vi.fn();
const mockChatLeadCreate = vi.fn();
const mockChatConversationUpdate = vi.fn();
const mockContactFindFirst = vi.fn();
const mockContactCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    chatLead: { findUnique: mockChatLeadFindUnique, create: mockChatLeadCreate },
    chatConversation: { findUnique: mockChatConversationFindUnique, update: mockChatConversationUpdate },
    contact: { findFirst: mockContactFindFirst, create: mockContactCreate },
  },
}));

vi.mock("../chatbot/lead-detection", () => ({
  extractLeadInfo: vi.fn(),
}));

describe("captureLeadFromConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing lead if found", async () => {
    mockChatLeadFindUnique.mockResolvedValue({ id: "lead-1", name: "John" });
    const { captureLeadFromConversation } = await import("../chatbot/lead-capture");
    const result = await captureLeadFromConversation("conv-1", "hello", "hi");
    expect(result).toEqual({ id: "lead-1", name: "John" });
    expect(mockChatConversationFindUnique).not.toHaveBeenCalled();
  });

  it("returns null when conversation not found", async () => {
    mockChatLeadFindUnique.mockResolvedValue(null);
    mockChatConversationFindUnique.mockResolvedValue(null);
    const { captureLeadFromConversation } = await import("../chatbot/lead-capture");
    const result = await captureLeadFromConversation("conv-1", "hello", "hi");
    expect(result).toBeNull();
  });

  it("returns null when leadInfo has no name or email", async () => {
    mockChatLeadFindUnique.mockResolvedValue(null);
    mockChatConversationFindUnique.mockResolvedValue({
      id: "conv-1",
      messages: [{ role: "user", content: "hi" }],
    });
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    (extractLeadInfo as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const { captureLeadFromConversation } = await import("../chatbot/lead-capture");
    const result = await captureLeadFromConversation("conv-1", "hello", "hi");
    expect(result).toBeNull();
  });

  it("creates a lead and updates conversation", async () => {
    mockChatLeadFindUnique.mockResolvedValue(null);
    mockChatConversationFindUnique.mockResolvedValue({
      id: "conv-1",
      messages: [{ role: "user", content: "I need a website" }],
    });
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    (extractLeadInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      company: "Acme",
    });
    mockChatLeadCreate.mockResolvedValue({ id: "lead-1", name: "John Doe", email: "john@example.com" });
    mockContactFindFirst.mockResolvedValue(null);
    mockContactCreate.mockResolvedValue({});
    const { captureLeadFromConversation } = await import("../chatbot/lead-capture");
    const result = await captureLeadFromConversation("conv-1", "I need a website", "Sure!");
    expect(mockChatLeadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          conversationId: "conv-1",
          name: "John Doe",
          email: "john@example.com",
        }),
      })
    );
    expect(mockChatConversationUpdate).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("creates contact when no existing contact with that email", async () => {
    mockChatLeadFindUnique.mockResolvedValue(null);
    mockChatConversationFindUnique.mockResolvedValue({
      id: "conv-1",
      messages: [],
    });
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    (extractLeadInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: "Jane",
      email: "jane@test.com",
    });
    mockChatLeadCreate.mockResolvedValue({ id: "lead-2", name: "Jane", email: "jane@test.com", priority: "HIGH" });
    mockContactFindFirst.mockResolvedValue(null);
    mockContactCreate.mockResolvedValue({});
    const { captureLeadFromConversation } = await import("../chatbot/lead-capture");
    await captureLeadFromConversation("conv-1", "hello", "hi");
    expect(mockContactCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: "Jane",
          email: "jane@test.com",
        }),
      })
    );
  });

  it("skips contact creation when contact already exists", async () => {
    mockChatLeadFindUnique.mockResolvedValue(null);
    mockChatConversationFindUnique.mockResolvedValue({
      id: "conv-1",
      messages: [],
    });
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    (extractLeadInfo as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Jane", email: "jane@test.com" });
    mockChatLeadCreate.mockResolvedValue({ id: "lead-2", name: "Jane", email: "jane@test.com", priority: "MEDIUM" });
    mockContactFindFirst.mockResolvedValue({ id: "contact-1" });
    const { captureLeadFromConversation } = await import("../chatbot/lead-capture");
    await captureLeadFromConversation("conv-1", "hello", "hi");
    expect(mockContactCreate).not.toHaveBeenCalled();
  });

  it("handles contact creation errors gracefully", async () => {
    mockChatLeadFindUnique.mockResolvedValue(null);
    mockChatConversationFindUnique.mockResolvedValue({
      id: "conv-1",
      messages: [],
    });
    const { extractLeadInfo } = await import("../chatbot/lead-detection");
    (extractLeadInfo as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Jane", email: "jane@test.com" });
    mockChatLeadCreate.mockResolvedValue({ id: "lead-2", name: "Jane", email: "jane@test.com", priority: "LOW" });
    mockContactFindFirst.mockRejectedValue(new Error("fail"));
    const { captureLeadFromConversation } = await import("../chatbot/lead-capture");
    await expect(captureLeadFromConversation("conv-1", "hello", "hi")).resolves.toBeDefined();
  });
});
