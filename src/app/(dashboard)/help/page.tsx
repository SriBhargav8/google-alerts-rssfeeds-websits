import Link from "next/link";
import { HelpCircle, BookOpen, Settings, Network, MessageSquare, ChevronDown, ExternalLink } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    icon: <BookOpen className="text-indigo-500" size={24} />,
    questions: [
      {
        q: "What is AutoFeed?",
        a: "AutoFeed is an automated content pipeline that ingests raw RSS feeds, processes the data through large language models (LLMs), and automatically publishes polished content to your CMS and social media.",
        link: "/dashboard",
        linkText: "View Dashboard"
      },
      {
        q: "How do I create my first workflow?",
        a: "Navigate to the Workflows page and click the 'New Workflow' button. You'll be guided through providing an RSS feed URL, selecting your AI model, setting a schedule, and picking destinations.",
        link: "/workflows/new",
        linkText: "Create a Workflow"
      },
      {
        q: "What is a Cron Schedule?",
        a: "A CRON schedule is a standardized time format that determines exactly when your workflow runs automatically (e.g., Every day at 8 AM, or every 15 minutes). You don't need to know CRON—we provide a visual builder!",
        link: "/workflows/new",
        linkText: "View Schedule Builder"
      },
      {
        q: "Can I edit a workflow after creating it?",
        a: "Yes, you can edit any workflow at any time. Simply click the settings gear icon on the workflow detail page to update the feeds, integrations, or schedule.",
        link: "/workflows",
        linkText: "Edit Workflows"
      }
    ]
  },
  {
    category: "AI & Processing",
    icon: <MessageSquare className="text-emerald-500" size={24} />,
    questions: [
      {
        q: "How does the AI generation work?",
        a: "We extract text from the RSS links you provide and pass it to LLMs (like GPT-4 or Claude) along with system prompts to summarize, expand, or rewrite the content into a cohesive article.",
        link: "/settings",
        linkText: "Configure Providers"
      },
      {
        q: "Can I use my own OpenAI or Anthropic API Keys?",
        a: "Yes! Navigate to the Settings tab to securely input your own API keys for OpenAI, Anthropic, or Google Gemini. Your keys are encrypted.",
        link: "/settings",
        linkText: "Manage API Keys"
      },
      {
        q: "What happens if I run out of API credits?",
        a: "If your underlying AI provider rejects the request due to quota limits, the workflow run will fail. You can view the specific error in the Execution Logs and re-run the workflow once you've topped up your balance.",
        link: "/logs",
        linkText: "Check Error Logs"
      },
      {
        q: "How do I change the system prompts?",
        a: "You can customize the base instructions given to the LLM by visiting the Settings page. This allows you to dictate the specific tone, style, and formatting of all generated content.",
        link: "/settings",
        linkText: "Customize Prompts"
      }
    ]
  },
  {
    category: "Destinations & Integrations",
    icon: <Network className="text-blue-500" size={24} />,
    questions: [
      {
        q: "How do I connect my WordPress site?",
        a: "Go to the Integrations page, click 'Connect WordPress', and provide your site's URL, your admin Username, and an Application Password generated from your WordPress user profile.",
        link: "/integrations",
        linkText: "Add WordPress"
      },
      {
        q: "Can I auto-post to X (Twitter) and LinkedIn?",
        a: "Yes! Once you authenticate your social accounts in the Integrations tab, you can select them as destinations. The AI will automatically generate platform-specific short-form copy for social posts.",
        link: "/integrations",
        linkText: "Manage Socials"
      },
      {
        q: "Where are my generated posts stored?",
        a: "Your final posts are sent directly to your connected destinations (like your CMS). We only store a temporary record of the generated text in the Execution Logs for your review.",
        link: "/logs",
        linkText: "View Execution History"
      },
      {
        q: "What if my WordPress credentials change?",
        a: "If you reset your WordPress password, your Application Password may be revoked. Head back to the Integrations page to delete the old connection and authenticate a new one.",
        link: "/integrations",
        linkText: "Update Integrations"
      }
    ]
  },
  {
    category: "Troubleshooting",
    icon: <Settings className="text-amber-500" size={24} />,
    questions: [
      {
        q: "Why is my workflow failing?",
        a: "Workflows can fail for several reasons: invalid RSS feeds, AI API rate limits, or expired integration credentials. Always check the Execution Logs to see exactly which step failed.",
        link: "/logs",
        linkText: "View Logs"
      },
      {
        q: "My RSS feed isn't pulling data, why?",
        a: "Ensure the URL provided is a valid XML RSS or Atom feed. AutoFeed cannot currently parse raw HTML web pages or sites that block automated scraping.",
        link: "/workflows",
        linkText: "Check Feed URLs"
      },
      {
        q: "How do I pause an active workflow?",
        a: "Go to the Workflows list and click the toggle switch next to any workflow, or click the 'Pause' button on the workflow's detail page. It will remain paused until you explicitly resume it.",
        link: "/workflows",
        linkText: "Manage Workflows"
      },
      {
        q: "Can I run a workflow manually outside of its schedule?",
        a: "Absolutely. Click the 'Run Now' button on any workflow page to immediately trigger an execution bypassing the schedule.",
        link: "/workflows",
        linkText: "View Workflows"
      }
    ]
  }
];

export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12">
      
      {/* Header */}
      <header className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-10 md:p-14 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20">
            <HelpCircle size={32} className="text-indigo-300" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            How can we help you?
          </h1>
          <p className="text-lg text-indigo-100 font-medium leading-relaxed">
            Browse our comprehensive FAQ below to learn how to create workflows, configure AI models, integrate your accounts, and troubleshoot common issues.
          </p>
        </div>
      </header>

      {/* FAQ Sections */}
      <div className="space-y-12">
        {faqs.map((section, idx) => (
          <section key={idx} className="scroll-mt-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-slate-100 rounded-xl">
                {section.icon}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{section.category}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.questions.map((faq, i) => (
                <div key={i} className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 rounded-2xl p-6 group flex flex-col h-full">
                  <h3 className="text-base font-bold text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    {faq.a}
                  </p>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link href={faq.link} className="inline-flex items-center space-x-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                      <span>{faq.linkText}</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Support Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center max-w-3xl mx-auto mt-12">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Still need help?</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          If you couldn't find the answer to your question, our support team is available to assist you with your configuration.
        </p>
        <a 
          href="mailto:sri.growbizonline@gmail.com?subject=AutoFeed Dashboard Support Request&body=Hi Support Team,%0A%0AI need help with..."
          className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm"
        >
          Contact Support Team
        </a>
      </div>

    </div>
  );
}
