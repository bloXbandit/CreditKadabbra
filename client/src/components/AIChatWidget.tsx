import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Sparkles, TrendingUp, FileText, Zap, Upload, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatWidgetProps {
  currentPage: string;
  context?: any;
}

export default function AIChatWidget({ currentPage, context }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportText, setReportText] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory } = trpc.ai.history.useQuery(undefined, {
    enabled: isOpen && !historyLoaded,
  });

  const clearHistoryMutation = trpc.ai.clearHistory.useMutation({
    onSuccess: () => {
      setMessages([{
        role: "assistant",
        content: `👋 **Hey! I'm your CreditKazzam Guru.**\n\nI've got 20+ years of experience cleaning up credit reports and maximizing scores. I know FCRA inside and out, Metro 2 compliance, dispute strategies, and all the tricks to optimize your credit.\n\n**I can help you:**\n- Analyze your credit reports and find errors\n- Write powerful dispute letters with legal citations\n- Suggest which disputes to file first for maximum impact\n- Optimize your payment timing and utilization\n- Explain credit score factors in plain English\n- Guide you through Wayfinder scenarios\n\nWhat do you want to tackle first?`,
      }]);
      toast.success("Chat history cleared");
    },
  });

  const quickActions = [
    { icon: TrendingUp, label: "Analyze my scores", prompt: "Analyze my current credit scores and tell me what factors are impacting them most. What should I focus on to improve my scores?" },
    { icon: FileText, label: "Write dispute letter", prompt: "Help me write a dispute letter for an error on my credit report. I need it to include proper FCRA citations and be legally sound." },
    { icon: Zap, label: "Optimize utilization", prompt: "Help me optimize my credit card utilization. When should I pay my balances to minimize the utilization reported to bureaus?" },
    { icon: Upload, label: "Find errors in report", action: () => setShowReportInput(true) },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.action) {
      action.action();
    } else if (action.prompt) {
      setMessages((prev) => [...prev, { role: "user", content: action.prompt }]);
      setIsTyping(true);
      chatMutation.mutate({
        messages: messages.concat({ role: "user", content: action.prompt }),
        context: { page: currentPage, ...context },
      });
    }
  };

  const handleReportAnalysis = () => {
    if (!reportText.trim()) {
      toast.error("Please paste your credit report text");
      return;
    }
    const analysisPrompt = `I'm pasting my credit report below. Please analyze it for errors, inaccuracies, and violations. Identify issues by severity (high/medium/low) and tell me which disputes to file first for maximum score impact.\n\n${reportText}`;
    setMessages((prev) => [...prev, { role: "user", content: "[Analyzing credit report...]" }]);
    setIsTyping(true);
    setShowReportInput(false);
    setReportText("");
    chatMutation.mutate({
      messages: messages.concat({ role: "user", content: analysisPrompt }),
      context: { page: currentPage, ...context },
    });
  };

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response: { message: string }) => {
      setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
      setIsTyping(false);
    },
    onError: (error: any) => {
      toast.error(`AI Error: ${error.message}`);
      setIsTyping(false);
    },
  });

  // Keyboard shortcut: Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && chatHistory && !historyLoaded) {
      if (chatHistory.length > 0) {
        setMessages(chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })));
      } else {
        setMessages([
          {
            role: "assistant",
            content: `👋 **Hey! I'm your CreditKazzam Guru.**\n\nI've got 20+ years of experience cleaning up credit reports and maximizing scores. I know FCRA inside and out, Metro 2 compliance, dispute strategies, and all the tricks to optimize your credit.\n\n**I can help you:**\n- Analyze your credit reports and find errors\n- Write powerful dispute letters with legal citations\n- Suggest which disputes to file first for maximum impact\n- Optimize your payment timing and utilization\n- Explain credit score factors in plain English\n- Guide you through Wayfinder scenarios\n\nWhat do you want to tackle first?`,
          },
        ]);
      }
      setHistoryLoaded(true);
    }
  }, [isOpen, chatHistory, historyLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    chatMutation.mutate({
      messages: messages.concat({ role: "user", content: userMessage }),
      context: {
        page: currentPage,
        ...context,
      },
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-br from-primary to-primary/80"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-2rem)] sm:h-[600px] shadow-2xl z-50 flex flex-col elegant-card border-2">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">🥄 CreditKazzam Guru 🥄</h3>
            <p className="text-xs text-muted-foreground">AI-Powered Expert Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => clearHistoryMutation.mutate()}
            className="h-8 w-8"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions - Show only when no messages */}
      {messages.length === 1 && (
        <div className="p-4 border-b bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action)}
                  className="h-auto py-2 px-3 flex flex-col items-start gap-1 text-left"
                  disabled={isTyping}
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Report Analysis Input */}
      {showReportInput && (
        <div className="p-4 border-b bg-muted/30 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Paste Credit Report Text</p>
            <Button variant="ghost" size="sm" onClick={() => setShowReportInput(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Paste your credit report text here...\n\nI'll analyze it for errors, Metro 2 violations, and FCRA compliance issues."
            className="min-h-[120px] text-xs"
          />
          <Button onClick={handleReportAnalysis} size="sm" className="w-full">
            Analyze Report
          </Button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" ? (
                  <Streamdown className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    {message.content}
                  </Streamdown>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Analyzing...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about credit repair..."
            disabled={isTyping}
            className="flex-1"
          />
          <Button type="submit" disabled={isTyping || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-muted">Cmd/Ctrl + /</kbd> to toggle chat
        </p>
      </form>
    </Card>
  );
}
