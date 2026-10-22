import { useEffect } from 'react';
import { MessageSquare, Sparkles, Clock, HelpCircle, ArrowRight, User } from 'lucide-react';
import { useStore } from '../store/store';

export function Assistant() {
  const { user } = useStore();

  useEffect(() => {
    // Configure Watson Assistant with main UI maroon brand theme
    window.watsonAssistantChatOptions = {
      integrationID: "80cb48fd-83fb-4b93-b0c2-acfb917e252b",
      region: "au-syd",
      serviceInstanceID: "41b4b817-39d9-4a02-ab29-be1134579c04",
      onLoad: async (instance) => {
        window.watsonInstance = instance;
        await instance.render();
        instance.updateCSSVariables({
          "BASE-z-index": "9999",
          "BASE-font-family": "'Poppins', sans-serif",
          "LAUNCHER-background": "#8A1C2B",
          "HEADER-background": "#8A1C2B",
          "HEADER-color": "#ffffff"
        });
      }
    };

    const existingScript = document.getElementById('watson-assistant-chat-entry');
    if (!existingScript) {
      const t = document.createElement('script');
      t.id = 'watson-assistant-chat-entry';
      t.src =
        "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
        (window.watsonAssistantChatOptions.clientVersion || 'latest') +
        "/WatsonAssistantChatEntry.js";
      document.head.appendChild(t);
    } else if (window.watsonInstance) {
      window.watsonInstance.updateCSSVariables({
        "BASE-z-index": "9999",
        "BASE-font-family": "'Poppins', sans-serif",
        "LAUNCHER-background": "#8A1C2B",
        "HEADER-background": "#8A1C2B",
        "HEADER-color": "#ffffff"
      });
    }
  }, []);

  const openChat = (autoSendText = 'Hi') => {
    const trigger = (instance) => {
      if (typeof instance.openWindow === 'function') {
        instance.openWindow();
      }
      if (autoSendText && typeof instance.send === 'function') {
        setTimeout(() => {
          instance.send(autoSendText).catch(() => {});
        }, 500);
      }
    };

    if (window.watsonInstance) {
      trigger(window.watsonInstance);
    } else {
      const checkInterval = setInterval(() => {
        if (window.watsonInstance) {
          trigger(window.watsonInstance);
          clearInterval(checkInterval);
        }
      }, 300);
      setTimeout(() => clearInterval(checkInterval), 4000);
    }
  };

  const startWithName = () => {
    const studentName = user?.name ? user.name.split(' ')[0] : 'Student';
    const trigger = (instance) => {
      if (typeof instance.openWindow === 'function') {
        instance.openWindow();
      }
      if (typeof instance.send === 'function') {
        // Send Hi first, then send the student's name
        instance.send('Hi')
          .then(() => {
            setTimeout(() => {
              instance.send(studentName).catch(() => {});
            }, 1200);
          })
          .catch(() => {});
      }
    };

    if (window.watsonInstance) {
      trigger(window.watsonInstance);
    } else {
      const checkInterval = setInterval(() => {
        if (window.watsonInstance) {
          trigger(window.watsonInstance);
          clearInterval(checkInterval);
        }
      }, 300);
      setTimeout(() => clearInterval(checkInterval), 4000);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-['Poppins',sans-serif]">
      {/* Hero Section styled with main UI maroon brand color */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0509] via-[#3d0b14] to-[#8A1C2B] p-8 md:p-14 text-white shadow-2xl border border-white/10">
        <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-md mb-4 text-rose-200 border border-white/10">
              <Sparkles className="h-4 w-4" /> Silver Oak University AI
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Welcome to <span className="text-rose-300">Silver Oak University</span> AI Assistant
            </h1>

            <p className="mt-5 text-base leading-relaxed text-rose-100/90 sm:text-lg max-w-xl">
              Ask university related queries instantly including courses,
              placements, exams, events, departments, and student support
              using our intelligent AI chatbot.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <button
                type="button"
                onClick={() => openChat('Hi')}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-7 py-3.5 text-base font-semibold text-[#8A1C2B] shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-rose-50 hover:shadow-2xl active:translate-y-0"
              >
                <MessageSquare className="h-5 w-5" /> Start Chat
              </button>

              {user?.name && (
                <button
                  type="button"
                  onClick={startWithName}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 active:translate-y-0"
                >
                  <User className="h-4 w-4 text-rose-300" /> Start as {user.name.split(' ')[0]} <ArrowRight className="h-4 w-4 opacity-70" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
              alt="AI Bot"
              className="w-56 sm:w-72 md:w-80 animate-[float_4s_ease-in-out_infinite] drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="group rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-[#8A1C2B] dark:bg-rose-950/40">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-ink">Smart Assistance</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Get quick answers for university services, campus information, and student queries.
          </p>
        </div>

        <div className="group rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-[#8A1C2B] dark:bg-rose-950/40">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-ink">Student Support</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            AI powered support for academic and campus related questions.
          </p>
        </div>

        <div className="group rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-[#8A1C2B] dark:bg-rose-950/40">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-ink">24×7 Assistant</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            Available anytime to answer your university related queries.
          </p>
        </div>
      </div>

      <footer className="mt-10 pb-6 text-center text-xs text-ink-3">
        © 2026 Silver Oak University | AI Assistant
      </footer>
    </div>
  );
}
