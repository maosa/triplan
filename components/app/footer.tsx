import { Instagram, Linkedin, Github } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full py-8 mt-8 border-t border-border/40">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center space-y-4">
                <div className="text-xs text-muted-foreground text-center">
                    &copy; 2026 TriPlan. Created by Andreas Maos. All rights reserved.
                </div>
                <div className="flex items-center space-x-6 text-muted-foreground">
                    <a
                        href="https://www.instagram.com/maos.andreas"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                        aria-label="Instagram"
                    >
                        <Instagram className="h-4 w-4" />
                    </a>
                    <a
                        href="https://www.linkedin.com/in/andreas-maos/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                        aria-label="LinkedIn"
                    >
                        <Linkedin className="h-4 w-4" />
                    </a>
                    <a
                        href="https://github.com/maosa/triplan"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                        aria-label="GitHub"
                    >
                        <Github className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </footer>
    )
}
