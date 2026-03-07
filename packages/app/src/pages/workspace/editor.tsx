interface EditorProps {
  value: string
  onChange: (value: string) => void
}

export function MilkdownEditor(props: EditorProps) {
  return (
    <textarea
      class="min-h-[400px] w-full resize-y rounded-2xl border border-border-weak-base bg-background-base p-4 text-14-regular text-text-strong outline-none placeholder:text-text-weak focus:border-border-strong-base font-mono leading-relaxed"
      placeholder="Start writing..."
      value={props.value}
      onInput={(e) => props.onChange(e.currentTarget.value)}
    />
  )
}
