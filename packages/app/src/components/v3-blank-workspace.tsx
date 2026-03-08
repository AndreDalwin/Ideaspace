import { useNavigate, useParams } from "@solidjs/router"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { SkillPickerDialog } from "./skill-picker-dialog"
import { FilePickerDialog } from "./file-picker-dialog"
import { FadeIn, SlideUp, StaggerItem } from "./transitions"

export function V3BlankWorkspace() {
  const navigate = useNavigate()
  const params = useParams()
  const dialog = useDialog()

  const handlePickSkill = () => {
    dialog.show(() => <SkillPickerDialog onClose={() => {}} />)
  }

  const handleAddFiles = () => {
    dialog.show(() => <FilePickerDialog onClose={() => {}} mode="session" />)
  }

  return (
    <div class="h-full flex items-center justify-center p-8">
      <div class="max-w-2xl text-center space-y-8">
        <FadeIn>
          <div class="space-y-2">
            <h1 class="text-28-semibold text-text-strong">👋 Welcome Back</h1>
            <p class="text-15-regular text-text-weak">Your workspace is ready. Start with intention.</p>
          </div>
        </FadeIn>
        <div class="grid gap-4 max-w-md mx-auto">
          <StaggerItem index={0}>
            <button
              onClick={handlePickSkill}
              class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group hover-lift w-full"
            >
              <div class="flex items-center gap-3">
                <span class="text-24">🎨</span>
                <div>
                  <div class="text-15-semibold text-text-strong">Pick a Skill</div>
                  <div class="text-13-regular text-text-weak">Choose a pre-configured skill to get started fast</div>
                </div>
              </div>
            </button>
          </StaggerItem>
          <StaggerItem index={1}>
            <button
              onClick={handleAddFiles}
              class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group hover-lift w-full"
            >
              <div class="flex items-center gap-3">
                <span class="text-24">📁</span>
                <div>
                  <div class="text-15-semibold text-text-strong">Add Files to Context</div>
                  <div class="text-13-regular text-text-weak">Select files from your project to work with</div>
                </div>
              </div>
            </button>
          </StaggerItem>
          <StaggerItem index={2}>
            <button
              onClick={() => navigate(`/${params.dir || "."}/session`)}
              class="p-4 rounded-2xl border border-border-weak-base bg-background-stronger hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-left group hover-lift w-full"
            >
              <div class="flex items-center gap-3">
                <span class="text-24">💬</span>
                <div>
                  <div class="text-15-semibold text-text-strong">Start Blank Session</div>
                  <div class="text-13-regular text-text-weak">Jump right in and ask the AI anything</div>
                </div>
              </div>
            </button>
          </StaggerItem>
        </div>
      </div>
    </div>
  )
}

export default V3BlankWorkspace
