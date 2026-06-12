import { BottomNav } from '@/components/app/bottom-nav'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-16 sm:pb-0">
        {children}
      </div>
      <BottomNav />
    </>
  )
}
