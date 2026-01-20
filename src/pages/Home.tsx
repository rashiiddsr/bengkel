import { Link } from 'react-router-dom';

const highlights = [
  {
    title: 'Layanan Servis Menyeluruh',
    description:
      'Perawatan rutin, tune-up, dan perbaikan mesin dengan standar kualitas bengkel modern.',
  },
  {
    title: 'Teknisi Berpengalaman',
    description:
      'Ditangani oleh mekanik terlatih yang memahami berbagai merek dan tipe kendaraan.',
  },
  {
    title: 'Transparansi & Konsultasi',
    description:
      'Estimasi biaya jelas, komunikasi terbuka, serta rekomendasi perawatan yang mudah dipahami.',
  },
];

const services = [
  'Servis berkala & pengecekan menyeluruh',
  'Perbaikan mesin, rem, kaki-kaki, dan kelistrikan',
  'Ganti oli, tune-up, dan servis AC',
  'Diagnostik komputer untuk kendaraan modern',
];

export function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-900/60 to-slate-950"></div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:py-20">
          <div className="flex-1 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
              Bintang Motor Auto Service
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Partner terpercaya untuk servis, perawatan, dan perbaikan kendaraan Anda.
            </h1>
            <p className="text-base text-slate-200 md:text-lg">
              Kami menghadirkan pengalaman bengkel yang profesional, cepat, dan transparan agar setiap
              perjalanan Anda tetap aman dan nyaman.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/login"
                className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Hubungi Kami
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-blue-300 px-6 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:text-white"
              >
                Lihat Layanan
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Jam Operasional
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Senin - Sabtu, 08.00 - 18.00</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Lokasi
                  </p>
                  <p className="mt-2 text-base text-slate-100">
                    Jl. Pahlawan No. 18, Kota Anda (dekat pusat servis otomotif)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Hotline
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">(021) 8899-8899</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-6 pb-20">
        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-blue-300/40"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-200">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-blue-500/10 p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4 md:max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">Tentang Kami</p>
              <h2 className="text-3xl font-bold">Bengkel modern dengan pelayanan personal.</h2>
              <p className="text-base text-slate-200">
                Bintang Motor Auto Service berkomitmen memberikan servis yang tepat sasaran, cepat, dan
                ramah untuk pelanggan pribadi maupun armada bisnis. Dengan teknologi diagnostik terkini
                dan tim ahli, kami memastikan kendaraan Anda selalu dalam kondisi prima.
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Layanan Unggulan</p>
              <ul className="space-y-2 text-sm text-slate-200">
                {services.map((service) => (
                  <li key={service} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-300"></span>
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Konsultasi</p>
            <p className="text-lg font-semibold text-white">Gratis evaluasi awal sebelum servis.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Garansi</p>
            <p className="text-lg font-semibold text-white">Standar mutu dengan garansi pengerjaan.</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200">Reservasi</p>
            <p className="text-lg font-semibold text-white">Hubungi kami untuk jadwal prioritas.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
