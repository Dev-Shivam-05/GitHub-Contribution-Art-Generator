import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <Link
              href="https://github.com/Dev-Shivam-05"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Dev-Shivam-05
            </Link>
            . The source code is available on{" "}
            <Link
              href="https://github.com/Dev-Shivam-05"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 text-center md:text-right">
          <p className="font-medium">All rights reserved with Dev-Shivam-05</p>
          <a 
            href="https://github.com/Dev-Shivam-05" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs mt-1 opacity-80 hover:underline hover:text-primary transition-colors block"
          >
            https://github.com/Dev-Shivam-05
          </a>
        </div>
      </div>
    </footer>
  )
}