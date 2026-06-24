import Link from "next/link"

const footerColumns = [
  {
    title: "产品",
    links: [
      { label: "项目市场", href: "/projects" },
      { label: "发布项目", href: "/projects/publish" },
      { label: "仪表盘", href: "/dashboard" },
    ],
  },
  {
    title: "公司",
    links: [
      { label: "关于我们", href: "/about" },
      { label: "帮助中心", href: "/help" },
      { label: "隐私政策", href: "/privacy" },
    ],
  },
  {
    title: "联系",
    links: [
      { label: "hello@jbgit.dev", href: "mailto:hello@jbgit.dev" },
      { label: "Twitter/X", href: "https://x.com" },
      { label: "GitHub", href: "https://github.com/boyhai88/jbgit" },
    ],
  },
]

function isExternalLink(href: string) {
  return href.startsWith("http") || href.startsWith("mailto:")
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B0B12]">
      <div className="mx-auto grid w-full max-w-[980px] gap-8 px-6 py-8 md:grid-cols-[1.25fr_1.75fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#6C63FF] text-xs text-white shadow-[0_0_28px_rgba(108,99,255,0.26)]">
              JB
            </span>
            <span className="text-lg text-white">JBGIT</span>
          </Link>
          <p className="mt-4 max-w-[320px] text-sm leading-6 text-gray-300">
            全球开发者协作与技能变现平台。连接talent，创造价值。
          </p>
          <p className="mt-4 font-mono text-sm text-gray-300">
            <span className="text-[#8D87FF]">128K+</span> 开发者
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-[#8D87FF]">18.9K</span> 项目
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">
                {column.title}
              </h3>
              <div className="mt-3 grid gap-2 text-sm text-white">
                {column.links.map((item) =>
                  isExternalLink(item.href) ? (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-white transition-colors hover:text-[#6C63FF] hover:underline"
                      rel={
                        item.href.startsWith("http")
                          ? "noreferrer"
                          : undefined
                      }
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-white transition-colors hover:text-[#6C63FF] hover:underline"
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}

export function SiteFooter() {
  return <Footer />
}
