import { Footer } from "@/components/app/footer"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Footer />
        </>
    )
}
