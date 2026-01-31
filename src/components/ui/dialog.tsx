import { createContext, useContext, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog')
  }
  return context
}

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const { onOpenChange } = useDialogContext()

  if (asChild) {
    return <span onClick={() => onOpenChange(true)}>{children}</span>
  }

  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  )
}

function DialogPortal({ children }: { children: ReactNode }) {
  const { open } = useDialogContext()

  return (
    <AnimatePresence>
      {open && children}
    </AnimatePresence>
  )
}

function DialogOverlay({ className }: { className?: string }) {
  const { onOpenChange } = useDialogContext()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('fixed inset-0 z-50 bg-black/80', className)}
      onClick={() => onOpenChange(false)}
    />
  )
}

interface DialogContentProps {
  className?: string
  children: ReactNode
}

function DialogContent({ className, children }: DialogContentProps) {
  const { onOpenChange } = useDialogContext()

  return (
    <DialogPortal>
      <DialogOverlay />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
          'border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </motion.div>
    </DialogPortal>
  )
}

function DialogHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
      {children}
    </div>
  )
}

function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  )
}

function DialogTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  )
}

function DialogDescription({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
