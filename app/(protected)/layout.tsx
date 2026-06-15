import { BottomNav } from '@/components/app/bottom-nav'
import { ToastProvider } from '@/components/ui/toast'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="pb-16 sm:pb-0">
        {children}
      </div>
      <BottomNav />
    </ToastProvider>
  )
}
