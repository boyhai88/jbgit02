import { LoginForm } from "@/components/auth/login-form"

const slogan = "连接全球开发者，让技能创造价值"

type LoginPageProps = {
  searchParams?: {
    error?: string
    next?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="flex min-h-screen flex-col bg-[#05050B] text-white lg:flex-row">
      <section className="relative flex min-h-[44vh] items-center justify-center overflow-hidden bg-[#0D0B22] px-8 py-14 lg:min-h-screen lg:w-1/2 lg:pl-20 lg:pr-16 xl:pl-24 xl:pr-20">
        <div className="pointer-events-none absolute -left-28 top-1/3 size-[28rem] rounded-full bg-[#6C63FF]/16 blur-3xl" />
        <div className="relative w-full max-w-[620px] lg:translate-x-10 xl:translate-x-16">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-lg bg-[#6C63FF] font-mono text-base text-white shadow-[0_0_30px_rgba(108,99,255,0.34)]">
              JB
            </span>
            <span className="text-3xl font-black tracking-normal">JBGIT</span>
          </div>

          <h1 className="mt-16 max-w-[760px] text-4xl font-black leading-tight tracking-normal text-white md:text-5xl lg:text-[3.1rem]">
            {slogan.slice(0, 8)}
            <span className="text-[#6C63FF]">{slogan.slice(8)}</span>
          </h1>

          <p className="mt-8 max-w-[540px] text-lg leading-8 text-white/45">
            加入 12 万+ 开发者社区，发现协作机会，透明获取项目收益。
          </p>

          <div className="mt-16 flex gap-12">
            <div>
              <div className="font-mono text-3xl text-white">128K+</div>
              <div className="mt-2 text-sm text-white/45">注册开发者</div>
            </div>
            <div>
              <div className="font-mono text-3xl text-white">$42.6M</div>
              <div className="mt-2 text-sm text-white/45">总交易额</div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-8 py-14 lg:w-1/2 lg:pl-16 lg:pr-20 xl:pr-24">
        <div className="w-full max-w-[460px] lg:translate-x-10 xl:translate-x-16">
          <LoginForm initialError={searchParams?.error} next={searchParams?.next} />
        </div>
      </section>
    </main>
  )
}
