import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';

export const InviteRedeemView: React.FC = () => {
  const { params, navigate } = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [classroomData, setClassroomData] = useState<any>(null);

  const token = params.token;

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus('error');
      setErrorMessage('Geçersiz veya eksik davet bağlantısı.');
      return;
    }

    if (!user) {
      // Must authenticate first
      return;
    }

    const redeem = async () => {
      setLoading(true);
      const res = await api.classrooms.redeemInvitation(token);
      setLoading(false);
      if (res.success) {
        setStatus('success');
        setClassroomData(res.data);
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Davet kodu doğrulanamadı veya süresi dolmuş.');
      }
    };

    redeem();
  }, [token, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Skeleton className="h-14 w-14 rounded-2xl bg-slate-800" />
        <Skeleton className="h-6 w-48 bg-slate-800" />
        <p className="text-xs text-slate-400">Sınıf davetiyesi doğrulanıyor...</p>
      </div>
    );
  }

  if (!user) {
    const returnTarget = `/invite/${token}`;
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 bg-[#060B14]">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
            <Users className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="cyan" className="uppercase text-[10px]">
              Akademik Sınıf Davetiyesi
            </Badge>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sanal Sınıfa Katılın
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              CENNA.live üzerinde öğretim üyeniz tarafından oluşturulmuş bir farmakoloji sınıfına davet edildiniz. Daveti onaylayıp sınıfa kaydolmak için giriş yapınız.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => navigate(`/auth/login?redirect=${encodeURIComponent(returnTarget)}`)}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs h-11"
            >
              Giriş Yap ve Daveti Kabul Et
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(`/auth/register?redirect=${encodeURIComponent(returnTarget)}`)}
              className="w-full text-xs h-10 border-slate-700"
            >
              Yeni Hesap Oluştur
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 bg-[#060B14]">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" className="uppercase text-[10px]">
              Kayıt Başarılı
            </Badge>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sınıfa Başarıyla Katıldınız!
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200">{classroomData?.name || 'Klinik Farmakoloji Sınıfı'}</strong> aktif üyesi oldunuz. Atanan görevlere ve müfredata hemen başlayabilirsiniz.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => navigate('/app/today')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-11"
            >
              Bugünün Çalışma Masasına Git
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/app/classrooms')}
              className="w-full text-xs h-10 border-slate-700"
            >
              Sınıflarımı Görüntüle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 bg-[#060B14]">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <Badge variant="destructive" className="uppercase text-[10px]">
            Hata
          </Badge>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Davet Kodu Kullanılamadı
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {errorMessage || 'Bu davet bağlantısının süresi dolmuş, kullanım sınırına ulaşılmış veya bağlantı geçersiz olabilir.'}
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => navigate('/app/classrooms')}
            className="w-full bg-slate-800 text-white font-semibold text-xs h-10 hover:bg-slate-700 border border-slate-700"
          >
            Sınıflarıma Dön
          </Button>
        </div>
      </div>
    </div>
  );
};
