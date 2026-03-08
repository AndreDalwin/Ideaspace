import { type JSX, type ParentProps, Show, createSignal, createEffect } from "solid-js"

interface FadeInProps extends ParentProps {
  delay?: number
  duration?: number
}

export function FadeIn(props: FadeInProps): JSX.Element {
  const [visible, setVisible] = createSignal(false)

  createEffect(() => {
    const delay = props.delay || 0
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  })

  return (
    <div
      style={{
        opacity: visible() ? 1 : 0,
        transition: `opacity ${props.duration || 300}ms ease-out`,
        "transition-delay": `${props.delay || 0}ms`,
      }}
    >
      {props.children}
    </div>
  )
}

interface SlideUpProps extends ParentProps {
  delay?: number
  duration?: number
}

export function SlideUp(props: SlideUpProps): JSX.Element {
  const [visible, setVisible] = createSignal(false)

  createEffect(() => {
    const delay = props.delay || 0
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  })

  return (
    <div
      style={{
        opacity: visible() ? 1 : 0,
        transform: visible() ? "translateY(0)" : "translateY(20px)",
        transition: `opacity ${props.duration || 300}ms ease-out, transform ${props.duration || 300}ms ease-out`,
        "transition-delay": `${props.delay || 0}ms`,
      }}
    >
      {props.children}
    </div>
  )
}

interface StaggerItemProps extends ParentProps {
  index: number
  baseDelay?: number
}

export function StaggerItem(props: StaggerItemProps): JSX.Element {
  const delay = (props.baseDelay || 0) + props.index * 50

  return <SlideUp delay={delay}>{props.children}</SlideUp>
}

interface PageTransitionProps extends ParentProps {
  key?: string
}

export function PageTransition(props: PageTransitionProps): JSX.Element {
  return <div class="animate-page-in w-full h-full">{props.children}</div>
}

interface ScaleInProps extends ParentProps {
  delay?: number
  duration?: number
}

export function ScaleIn(props: ScaleInProps): JSX.Element {
  const [visible, setVisible] = createSignal(false)

  createEffect(() => {
    const delay = props.delay || 0
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  })

  return (
    <div
      style={{
        opacity: visible() ? 1 : 0,
        transform: visible() ? "scale(1)" : "scale(0.95)",
        transition: `opacity ${props.duration || 200}ms ease-out, transform ${props.duration || 200}ms ease-out`,
        "transition-delay": `${props.delay || 0}ms`,
      }}
    >
      {props.children}
    </div>
  )
}

interface StaggerContainerProps extends ParentProps {
  baseDelay?: number
  staggerDelay?: number
}

export function StaggerContainer(props: StaggerContainerProps): JSX.Element {
  return <>{props.children}</>
}
