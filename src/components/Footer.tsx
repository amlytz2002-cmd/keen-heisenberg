import React from 'react';
import { useRouter } from '../context/RouterContext';
import { ShieldCheck, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer className="w-full bg-[#060B14] border-t border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 text-slate-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Col */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-sky-500/20">
              C
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              CENNA<span className="text-sky-400">.live</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Farmasötik kimya, moleküler kurtarma laboratuvarı ve klinik farmakoloji için yeni nesil simülasyon ve yapay zekâ pekiştirme platformu.
          </p>
          <div className="text-[11px] text-slate-500 pt-2">
            © {new Date().getFullYear()} CENNA.live. Tüm hakları saklıdır.
          </div>
        </div>

        {/* Column 2: Pillars */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Pedagojik Çekirdek
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => navigate('/how-it-works')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                4 Aşamalı Bütünleşik Döngü
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                21 Klinik Kurtarma Laboratuvarı
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                Sokratik İpucu İskelesi (3 Aşama)
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                FSRS Aralıklı Tekrar Algoritması
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Tools & Models */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Klinik & Simülasyon
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => navigate('/features')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                Moleküler Farmakofor Toolbox
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                Enzim Parçalanma Simülatörü
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                Reseptör Cep Uyumu & ΔG
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                Cockcroft-Gault & CrCl Hesaplayıcı
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Legal & Security */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Güvenlik & Hukuki
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => navigate('/terms')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                Kullanım Koşulları
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/privacy')}
                className="hover:text-sky-300 transition-colors text-left"
              >
                Gizlilik & KVKK Politikası
              </button>
            </li>
            <li>
              <a
                href="mailto:iletisim@cenna.live"
                className="inline-flex items-center gap-1.5 hover:text-sky-300 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-sky-400" />
                <span>iletisim@cenna.live</span>
              </a>
            </li>
            <li className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>PostgreSQL RLS Satır Güvenliği</span>
              </div>
              <p>Edge Runtime Cloudflare Workers</p>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
