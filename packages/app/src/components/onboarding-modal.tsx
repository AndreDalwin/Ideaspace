import { useNavigate } from "@solidjs/router"
import { type JSX, createSignal, createEffect, Show, For } from "solid-js"

const steps = [
  {
    title: "Welcome to Ideaspace",
    description: "Your AI-powered workspace for building amazing things. Let's get you set up in just a few steps.",
    icon: "🚀",
  },
  {
    title: "Explore Your Workspace",
    description:
      "The sidebar gives you quick access to sessions, skills, tasks, and your project files. Everything you need is just one click away.",
    icon: "🗂️",
  },
  {
    title: "Use Skills",
    description:
      "Skills are pre-configured AI assistants for specific tasks. Try 'Write Content' for documentation or 'Code Review' for improving your code.",
    icon: "🎨",
  },
  {
    title: "Manage Context",
    description:
      "Add files to your context bank so the AI understands your codebase. Create context sets to organize related files together.",
    icon: "📁",
  },
  {
    title: "You're Ready!",
    description:
      "Start a new session and begin building. You can always come back to skills or create your own custom ones.",
    icon: "✨",
  },
]

export function OnboardingModal(): JSX.Element {
  const navigate = useNavigate()
  const [show, setShow] = createSignal(false)
  const [step, setStep] = createSignal(0)

  createEffect(() => {
    const onboarded = localStorage.getItem("ideaspace:onboarded")
    if (!onboarded) {
      setShow(true)
    }
  })

  const handleSkip = () => {
    localStorage.setItem("ideaspace:onboarded", "true")
    setShow(false)
  }

  const handleNext = () => {
    if (step() < steps.length - 1) {
      setStep(step() + 1)
    } else {
      handleSkip()
    }
  }

  const handleBack = () => {
    if (step() > 0) {
      setStep(step() - 1)
    }
  }

  const handleStart = () => {
    handleSkip()
    navigate("/skills/new")
  }

  const progress = () => ((step() + 1) / steps.length) * 100

  return (
    <Show when={show()}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50 animate-fade-in" onClick={handleSkip} />
        <div class="relative bg-background-base rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                <span class="text-24">{steps[step()].icon}</span>
                <span class="text-13-medium text-text-weak">
                  Step {step() + 1} of {steps.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                class="text-13-regular text-text-weak hover:text-text-strong transition-colors"
              >
                Skip
              </button>
            </div>

            <div class="h-1 bg-background-stronger rounded-full mb-6">
              <div
                class="h-full bg-accent-primary rounded-full transition-all duration-300"
                style={{ width: `${progress()}%` }}
              />
            </div>

            <div class="text-center mb-8">
              <h2 class="text-24-semibold text-text-strong mb-3">{steps[step()].title}</h2>
              <p class="text-15-regular text-text-weak">{steps[step()].description}</p>
            </div>

            <div class="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={step() === 0}
                class="px-4 py-2 rounded-lg text-14-medium text-text-weak hover:text-text-strong hover:bg-background-stronger transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Back
              </button>

              <div class="flex items-center gap-2">
                <Show when={step() === steps.length - 1}>
                  <button
                    onClick={handleStart}
                    class="px-4 py-2 rounded-lg text-14-medium bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                  >
                    Create Skill
                  </button>
                </Show>
                <button
                  onClick={handleNext}
                  class="px-4 py-2 rounded-lg text-14-medium bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                >
                  {step() === steps.length - 1 ? "Get Started" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}
