
import {
  useState,
  type FormEvent
} from "react";

import {
  BookOpen,
  Send,
  Bot,
  UserRound,
  Globe2
} from "lucide-react";

import { api, getErrorMessage } from "../../services/api";

interface GuideSource {
  title: string;
  url?: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: GuideSource[];
}

export default function TourGuidePage() {
  const [language, setLanguage] =
    useState<"en" | "si">("en");

  const [question, setQuestion] = useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendQuestion(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const text = question.trim();

    if (!text || loading) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/guide/chat", {
        message: text,
        language
      });

      setMessages(previous => [
        ...previous,
        {
          id: Date.now(),
          role: "user",
          text
        },
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            typeof data.answer === "string"
              ? data.answer
              : "No answer available.",
          sources: Array.isArray(data.sources)
            ? data.sources
            : []
        }
      ]);

      setQuestion("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container inner-page">
      <div className="page-title">
        <span className="section-eyebrow">
          MODULE 02 · AI TOUR GUIDE
        </span>

        <h1>AI Cultural Tour Guide</h1>

        <p>
          Explore Sri Lanka's history, cultural heritage,
          traditions and famous attractions.
        </p>
      </div>

      <div className="panel guide-chat-panel">
        <div className="guide-chat-header">
          <div className="guide-chat-title">
            <BookOpen size={26} />

            <div>
              <h3>Gocelone Cultural Assistant</h3>
              <small>
                Multilingual Heritage Information
              </small>
            </div>
          </div>

          <label className="guide-language">
            <Globe2 size={17} />

            <select
              value={language}
              onChange={e =>
                setLanguage(
                  e.target.value as "en" | "si"
                )
              }
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
            </select>
          </label>
        </div>

        <div className="guide-chat-messages">
          {messages.length === 0 && (
            <div className="guide-empty-chat">
              <Bot size={48} />

              <h3>Discover Sri Lanka with AI</h3>

              <p>
                Ask a cultural or historical question
                to begin your conversation.
              </p>

              <div className="guide-suggestions">
                <button
                  type="button"
                  onClick={() =>
                    setQuestion(
                      "What is the history of Sigiriya?"
                    )
                  }
                >
                  History of Sigiriya
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion(
                      "Tell me about the Temple of the Tooth."
                    )
                  }
                >
                  Temple of the Tooth
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion(
                      "What are the traditions of Sri Lanka?"
                    )
                  }
                >
                  Sri Lankan Traditions
                </button>
              </div>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "guide-message guide-user-message"
                  : "guide-message guide-ai-message"
              }
            >
              <div className="guide-message-icon">
                {message.role === "user"
                  ? <UserRound size={19} />
                  : <Bot size={19} />}
              </div>

              <div className="guide-message-body">
                <strong>
                  {message.role === "user"
                    ? "You"
                    : "Gocelone AI Guide"}
                </strong>

                <p>{message.text}</p>

                {!!message.sources?.length && (
                  <div className="guide-sources">
                    <strong>Sources</strong>

                    {message.sources.map((source, index) => (
                      source.url ? (
                        <a
                          key={index}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.title}
                        </a>
                      ) : (
                        <p key={index}>
                          {source.title}
                        </p>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <p className="guide-loading">
              Searching heritage information...
            </p>
          )}
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form
          className="guide-chat-form"
          onSubmit={sendQuestion}
        >
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={
              language === "si"
                ? "ඔබගේ ප්‍රශ්නය මෙතැන ලියන්න..."
                : "Ask about Sri Lankan culture..."
            }
            required
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !question.trim()}
          >
            <Send size={18} />
            Send
          </button>
        </form>
      </div>

      <p className="content-note">
        This AI guide requires the cultural RAG backend.
        Answers and source citations should be verified
        before being used as authoritative information.
      </p>
    </div>
  );
}
