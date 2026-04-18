import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import { useWallet, Transaction } from "@/hooks/useWallet";

const NAV_ITEMS = [
  { label: "Главная", id: "home" },
  { label: "Игры", id: "games" },
  { label: "Турниры", id: "tournaments" },
  { label: "Промоции", id: "promos" },
  { label: "Профиль", id: "profile" },
  { label: "Поддержка", id: "support" },
  { label: "О платформе", id: "about" },
];

const GAMES = [
  { name: "Baccarat Royale", category: "Карты", rtp: "98.9%", emoji: "🃏", hot: true },
  { name: "Lightning Roulette", category: "Рулетка", rtp: "97.3%", emoji: "🎰", hot: true },
  { name: "Dragon Tiger", category: "Карты", rtp: "96.8%", emoji: "🐉", hot: false },
  { name: "Blackjack VIP", category: "Карты", rtp: "99.5%", emoji: "♠️", hot: false },
  { name: "Aviator", category: "Crash", rtp: "97.0%", emoji: "✈️", hot: true },
  { name: "Sweet Bonanza", category: "Слоты", rtp: "96.5%", emoji: "🍬", hot: false },
];

const TOURNAMENTS = [
  { name: "Grand Prix Royale", prize: "5,000,000 ₽", participants: 847, endsIn: "2д 14ч", status: "active" },
  { name: "Roulette Masters", prize: "1,500,000 ₽", participants: 312, endsIn: "5д 8ч", status: "active" },
  { name: "Slots Championship", prize: "3,000,000 ₽", participants: 1204, endsIn: "Регистрация", status: "soon" },
];

const PROMOS = [
  {
    title: "Приветственный бонус",
    subtitle: "+200% к первому депозиту",
    description: "До 150,000 ₽ на первый депозит плюс 200 фриспинов в лучших слотах",
    icon: "Gift",
    color: "from-gold-600 to-gold-400",
    badge: "Новым игрокам",
  },
  {
    title: "Пакет Фриспинов",
    subtitle: "500 бесплатных вращений",
    description: "Еженедельное пополнение фриспинов для активных игроков платформы",
    icon: "Zap",
    color: "from-purple-700 to-purple-500",
    badge: "Каждую неделю",
  },
  {
    title: "Программа Лояльности",
    subtitle: "Уровни от Bronze до Diamond",
    description: "Накапливайте очки с каждой ставкой и обменивайте на реальные деньги",
    icon: "Crown",
    color: "from-blue-700 to-blue-500",
    badge: "VIP клуб",
  },
];

const LOYALTY_LEVELS = [
  { name: "Bronze", points: "0–999", multiplier: "1x", color: "#CD7F32", emoji: "🥉" },
  { name: "Silver", points: "1000–4999", multiplier: "1.5x", color: "#C0C0C0", emoji: "🥈" },
  { name: "Gold", points: "5000–19999", multiplier: "2x", color: "#D4AF37", emoji: "🥇" },
  { name: "Platinum", points: "20000–49999", multiplier: "3x", color: "#E5E4E2", emoji: "💎" },
  { name: "Diamond", points: "50000+", multiplier: "5x", color: "#B9F2FF", emoji: "👑" },
];

const BENEFITS = [
  ["Cashback 5%"],
  ["Cashback 5%", "Турниры"],
  ["Cashback 10%", "Турниры", "Бонусы"],
  ["Cashback 15%", "Менеджер", "Бонусы"],
  ["Cashback 20%", "Менеджер", "Быстрый вывод"],
];

const FAQ = [
  { q: "Как получить приветственный бонус?", a: "Зарегистрируйтесь, пополните счёт на сумму от 1000 ₽ и бонус будет зачислен автоматически в течение нескольких секунд." },
  { q: "Как работает программа лояльности?", a: "За каждые 100 ₽ ставок вы получаете 1 очко лояльности. Очки суммируются и открывают новые уровни привилегий." },
  { q: "Как вывести выигрыш?", a: "Вывод доступен через личный кабинет. Минимальная сумма — 500 ₽. Срок обработки — от 15 минут до 24 часов." },
  { q: "Лицензировано ли казино?", a: "Grand Royal Casino работает на основании международной лицензии и соответствует всем стандартам честной игры." },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loyaltyActive, setLoyaltyActive] = useState(2);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [authForm, setAuthForm] = useState({ email: "", username: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, login, register, logout, updateBalance } = useAuth();
  const { deposit, withdraw, fetchHistory, transactions, loading: walletLoading, error: walletError, setError: setWalletError } = useWallet();

  const [walletModal, setWalletModal] = useState<"deposit" | "withdraw" | "history" | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletMethod, setWalletMethod] = useState("card");
  const [walletSuccess, setWalletSuccess] = useState("");

  const openWallet = (mode: "deposit" | "withdraw" | "history") => {
    setWalletModal(mode);
    setWalletAmount("");
    setWalletSuccess("");
    setWalletError("");
    if (mode === "history") fetchHistory();
  };

  const closeWallet = () => { setWalletModal(null); setWalletSuccess(""); setWalletError(""); };

  const handleWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(walletAmount);
    if (!amount || amount <= 0) return;
    const fn = walletModal === "deposit" ? deposit : withdraw;
    const { data, error } = await fn(amount, walletMethod);
    if (error) return;
    if (data?.balance !== undefined) updateBalance(data.balance as number);
    setWalletSuccess(
      walletModal === "deposit"
        ? `Баланс пополнен на ${amount.toLocaleString()} ₽`
        : `Заявка на вывод ${amount.toLocaleString()} ₽ принята`
    );
    setWalletAmount("");
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const openAuth = (mode: "login" | "register") => {
    setAuthModal(mode);
    setAuthForm({ email: "", username: "", password: "" });
    setAuthError("");
    setShowPassword(false);
  };

  const closeAuth = () => { setAuthModal(null); setAuthError(""); };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    let err: string | null = null;
    if (authModal === "login") {
      err = await login(authForm.email, authForm.password);
    } else {
      err = await register(authForm.email, authForm.username, authForm.password);
    }
    setAuthLoading(false);
    if (err) { setAuthError(err); return; }
    closeAuth();
  };

  return (
    <div className="min-h-screen bg-casino-darker text-white font-montserrat overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      {/* ─── NAVBAR ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gold-600/20 backdrop-blur-xl bg-casino-darker/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo("home")} className="flex items-center gap-2">
            <span className="text-2xl">♛</span>
            <span className="font-cormorant text-xl font-bold tracking-widest text-gold-400">GRAND ROYAL</span>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`px-4 py-2 text-xs font-medium tracking-widest uppercase transition-all duration-300 rounded ${
                  activeSection === item.id
                    ? "text-gold-400 bg-gold-600/10"
                    : "text-white/60 hover:text-gold-300 hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gold-600/30 bg-gold-600/5">
                  <span className="text-base">👑</span>
                  <div>
                    <div className="text-gold-400 text-xs font-bold leading-none">{user.username}</div>
                    <div className="text-white/40 text-xs leading-none mt-0.5">{user.loyalty_level}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-xs font-semibold tracking-widest uppercase text-white/50 border border-white/10 rounded hover:border-red-500/40 hover:text-red-400 transition-all duration-300"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuth("login")}
                  className="px-4 py-2 text-xs font-semibold tracking-widest uppercase text-gold-400 border border-gold-600/40 rounded hover:border-gold-400 hover:bg-gold-600/10 transition-all duration-300"
                >
                  Войти
                </button>
                <button
                  onClick={() => openAuth("register")}
                  className="px-5 py-2 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-gold-600 to-gold-400 text-casino-darker rounded hover:shadow-lg hover:shadow-gold-600/30 transition-all duration-300"
                >
                  Регистрация
                </button>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-gold-400">
            <Icon name={mobileOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-casino-dark border-t border-gold-600/20 px-4 py-4 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-left px-4 py-3 text-sm text-white/70 hover:text-gold-400 tracking-widest uppercase border-b border-white/5"
              >
                {item.label}
              </button>
            ))}
            {user ? (
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-gold-400 text-sm font-semibold">👑 {user.username}</span>
                <button onClick={logout} className="text-white/40 text-xs hover:text-red-400 transition-colors">Выйти</button>
              </div>
            ) : (
              <div className="flex gap-3 mt-3">
                <button onClick={() => openAuth("login")} className="flex-1 py-2 text-xs font-semibold text-gold-400 border border-gold-600/40 rounded">Войти</button>
                <button onClick={() => openAuth("register")} className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-gold-600 to-gold-400 text-casino-darker rounded">Регистрация</button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-16">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(https://cdn.poehali.dev/projects/3ea68512-99ef-423f-814e-23f787638bd9/files/7afcdf4b-4033-411d-97fd-4d1110655ead.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-casino-darker/60 via-casino-darker/70 to-casino-darker" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gold-500/40 bg-gold-600/10 text-gold-400 text-xs tracking-widest uppercase font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
            Добро пожаловать в элиту
          </div>

          <h1 className="font-cormorant text-6xl md:text-8xl font-light tracking-wider mb-4 leading-none">
            <span className="text-white">GRAND</span>{" "}
            <span
              className="font-semibold"
              style={{
                backgroundImage: "linear-gradient(135deg, #D4AF37 0%, #FFF0A0 40%, #D4AF37 60%, #B8960C 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ROYAL
            </span>
          </h1>
          <h2 className="font-cormorant text-6xl md:text-8xl font-light tracking-wider mb-8 text-white/80">
            CASINO
          </h2>

          <p className="text-white/60 text-base md:text-lg font-light tracking-wide max-w-xl mx-auto mb-12 leading-relaxed">
            Эксклюзивный игровой опыт для истинных ценителей. Роскошь, адреналин и большие выигрыши ждут вас.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => scrollTo("games")}
              className="px-10 py-4 text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-gold-700 to-gold-400 text-casino-darker rounded hover:shadow-2xl hover:shadow-gold-600/40 transition-all duration-500 hover:scale-105 animate-pulse-gold"
            >
              Начать Игру
            </button>
            <button
              onClick={() => scrollTo("promos")}
              className="px-10 py-4 text-sm font-semibold tracking-widest uppercase text-gold-400 border border-gold-600/40 rounded hover:border-gold-400 hover:bg-gold-600/10 transition-all duration-300"
            >
              Получить Бонус
            </button>
          </div>

          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { num: "2,400+", label: "Игр" },
              { num: "50M ₽", label: "Выплат сегодня" },
              { num: "98K+", label: "Игроков" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-cormorant text-3xl font-semibold text-gold-400">{s.num}</div>
                <div className="text-white/40 text-xs tracking-widest uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gold-600/50">
          <Icon name="ChevronDown" size={24} />
        </div>
      </section>

      {/* ─── GAMES ─── */}
      <section id="games" className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-xs tracking-widest uppercase font-semibold mb-3">Эксклюзивный выбор</p>
            <h2 className="font-cormorant text-5xl md:text-6xl font-light text-white">
              Популярные <span className="text-gold-400 italic">Игры</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-6" />
          </div>

          <div className="flex justify-center gap-3 mb-10 flex-wrap">
            {["Все", "Карты", "Рулетка", "Слоты", "Crash"].map((cat) => (
              <button key={cat} className="px-5 py-2 text-xs tracking-widest uppercase border border-gold-600/30 text-white/60 rounded hover:border-gold-400 hover:text-gold-400 transition-all duration-200">
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAMES.map((game, i) => (
              <div
                key={game.name}
                className="group relative bg-casino-card border border-casino-border rounded-xl overflow-hidden hover:border-gold-600/50 transition-all duration-500 hover:shadow-xl hover:shadow-gold-900/20 cursor-pointer"
              >
                <div className="relative h-44 bg-gradient-to-br from-casino-surface to-casino-dark flex items-center justify-center">
                  <span className="text-7xl animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
                    {game.emoji}
                  </span>
                  {game.hot && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-red-500/20 border border-red-500/40 rounded text-red-400 text-xs font-bold tracking-wider">
                      🔥 HOT
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-casino-card to-transparent" />
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-cormorant text-xl font-semibold text-white group-hover:text-gold-300 transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-white/40 text-xs tracking-widest uppercase mt-1">{game.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-gold-400 text-xs font-semibold">RTP</div>
                      <div className="text-white text-sm font-bold">{game.rtp}</div>
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2.5 text-xs font-bold tracking-widest uppercase bg-gold-600/10 text-gold-400 border border-gold-600/30 rounded hover:bg-gradient-to-r hover:from-gold-700 hover:to-gold-500 hover:text-casino-darker hover:border-transparent transition-all duration-300">
                    Играть
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-10 py-3 text-sm font-semibold tracking-widest uppercase text-gold-400 border border-gold-600/40 rounded hover:border-gold-400 hover:bg-gold-600/10 transition-all duration-300">
              Все 2400+ игр
            </button>
          </div>
        </div>
      </section>

      {/* ─── TOURNAMENTS ─── */}
      <section id="tournaments" className="relative z-10 py-24 px-4 bg-casino-dark/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-xs tracking-widest uppercase font-semibold mb-3">Соревнования</p>
            <h2 className="font-cormorant text-5xl md:text-6xl font-light text-white">
              Активные <span className="text-gold-400 italic">Турниры</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TOURNAMENTS.map((t, i) => (
              <div
                key={t.name}
                className={`relative bg-casino-card border rounded-xl p-6 overflow-hidden transition-all duration-300 hover:scale-105 ${
                  i === 0 ? "border-gold-500/50 shadow-lg shadow-gold-900/20" : "border-casino-border hover:border-gold-600/40"
                }`}
              >
                {i === 0 && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{i === 0 ? "🏆" : i === 1 ? "🥈" : "🎯"}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                    t.status === "active"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-gold-600/20 text-gold-400 border border-gold-600/30"
                  }`}>
                    {t.status === "active" ? "Идёт" : "Скоро"}
                  </span>
                </div>

                <h3 className="font-cormorant text-2xl font-semibold text-white mb-4">{t.name}</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs tracking-wider">Призовой фонд</span>
                    <span className="text-gold-400 font-bold text-lg font-cormorant">{t.prize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs tracking-wider">Участников</span>
                    <span className="text-white text-sm">{t.participants.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs tracking-wider">Завершение</span>
                    <span className={`text-sm font-semibold ${t.status === "active" ? "text-red-400" : "text-gold-400"}`}>
                      {t.endsIn}
                    </span>
                  </div>
                </div>

                <button className="w-full mt-5 py-3 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-gold-700 to-gold-500 text-casino-darker rounded hover:shadow-lg hover:shadow-gold-600/30 transition-all duration-300">
                  {t.status === "active" ? "Присоединиться" : "Зарегистрироваться"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROMOS ─── */}
      <section id="promos" className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-xs tracking-widest uppercase font-semibold mb-3">Эксклюзивные предложения</p>
            <h2 className="font-cormorant text-5xl md:text-6xl font-light text-white">
              Бонусы & <span className="text-gold-400 italic">Промоции</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {PROMOS.map((promo) => (
              <div
                key={promo.title}
                className="group bg-casino-card border border-casino-border rounded-xl p-7 hover:border-gold-600/40 transition-all duration-500 hover:shadow-xl hover:shadow-gold-900/20"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${promo.color} flex items-center justify-center mb-5`}>
                  <Icon name={promo.icon} fallback="Gift" size={22} className="text-white" />
                </div>

                <div className="inline-block px-3 py-1 bg-gold-600/10 border border-gold-600/20 rounded-full text-gold-500 text-xs tracking-widest uppercase font-semibold mb-3">
                  {promo.badge}
                </div>

                <h3 className="font-cormorant text-2xl font-semibold text-white mb-2">{promo.title}</h3>
                <p className="text-gold-400 text-sm font-semibold mb-3">{promo.subtitle}</p>
                <p className="text-white/50 text-sm leading-relaxed">{promo.description}</p>

                <button className="mt-6 w-full py-3 text-xs font-bold tracking-widest uppercase text-gold-400 border border-gold-600/30 rounded group-hover:bg-gold-600/10 group-hover:border-gold-400 transition-all duration-300">
                  Получить бонус
                </button>
              </div>
            ))}
          </div>

          {/* Loyalty Program */}
          <div className="bg-casino-card border border-gold-600/20 rounded-2xl p-8 md:p-10">
            <div className="text-center mb-10">
              <p className="text-gold-500 text-xs tracking-widest uppercase font-semibold mb-3">Привилегии для VIP</p>
              <h3 className="font-cormorant text-4xl font-light text-white">
                Программа <span className="text-gold-400 italic">Лояльности</span>
              </h3>
            </div>

            <div className="grid grid-cols-5 gap-2 md:gap-4 mb-8">
              {LOYALTY_LEVELS.map((level, i) => (
                <button
                  key={level.name}
                  onClick={() => setLoyaltyActive(i)}
                  className={`flex flex-col items-center p-3 md:p-5 rounded-xl border transition-all duration-300 ${
                    loyaltyActive === i ? "bg-white/5 scale-105" : "border-white/10 hover:border-white/20"
                  }`}
                  style={{ borderColor: loyaltyActive === i ? level.color : undefined }}
                >
                  <div className="text-xl md:text-3xl mb-2">{level.emoji}</div>
                  <div className="text-xs md:text-sm font-bold tracking-wider" style={{ color: level.color }}>
                    {level.name}
                  </div>
                  <div className="text-white/30 text-xs mt-1 hidden md:block">{level.multiplier}</div>
                </button>
              ))}
            </div>

            <div className="bg-casino-surface rounded-xl p-6 border border-white/5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-cormorant text-2xl font-semibold" style={{ color: LOYALTY_LEVELS[loyaltyActive].color }}>
                    Уровень {LOYALTY_LEVELS[loyaltyActive].name}
                  </h4>
                  <p className="text-white/50 text-sm mt-1">
                    Очки: {LOYALTY_LEVELS[loyaltyActive].points} • Множитель: {LOYALTY_LEVELS[loyaltyActive].multiplier}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BENEFITS[loyaltyActive].map((benefit) => (
                    <div
                      key={benefit}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{ borderColor: `${LOYALTY_LEVELS[loyaltyActive].color}50`, color: LOYALTY_LEVELS[loyaltyActive].color }}
                    >
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROFILE ─── */}
      <section id="profile" className="relative z-10 py-24 px-4 bg-casino-dark/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-xs tracking-widest uppercase font-semibold mb-3">Личный кабинет</p>
            <h2 className="font-cormorant text-5xl md:text-6xl font-light text-white">
              Ваш <span className="text-gold-400 italic">Профиль</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-6" />
          </div>

          <div className="bg-casino-card border border-casino-border rounded-2xl overflow-hidden">
            <div className="relative h-32 bg-gradient-to-r from-casino-navy via-casino-surface to-casino-navy">
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212,175,55,0.1) 10px, rgba(212,175,55,0.1) 20px)" }}
              />
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 rounded-full border-4 border-gold-500/50 bg-casino-dark flex items-center justify-center text-3xl">
                  👑
                </div>
              </div>
            </div>

            <div className="pt-14 px-8 pb-8">
              {user ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                      <h3 className="font-cormorant text-3xl font-semibold text-white">{user.username}</h3>
                      <p className="text-white/40 text-sm mt-1">{user.email}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
                        ● Активен
                      </div>
                      <button onClick={logout} className="px-4 py-2 text-xs font-semibold tracking-widest uppercase text-white/40 border border-white/10 rounded hover:text-red-400 hover:border-red-500/30 transition-all duration-300">
                        Выйти
                      </button>
                    </div>
                  </div>
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Баланс", value: `${user.balance.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽`, icon: "Wallet" },
                      { label: "Очки лояльности", value: user.loyalty_points.toLocaleString(), icon: "Star" },
                      { label: "Фриспины", value: user.freespins.toString(), icon: "Zap" },
                      { label: "Уровень", value: user.loyalty_level, icon: "Award" },
                    ].map((item) => (
                      <div key={item.label} className="bg-casino-surface rounded-xl p-4 border border-white/5 hover:border-gold-600/20 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name={item.icon} fallback="Star" size={14} className="text-gold-500" />
                          <span className="text-white/40 text-xs tracking-wider">{item.label}</span>
                        </div>
                        <div className="font-cormorant text-2xl text-gold-300">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Wallet actions */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <button
                      onClick={() => openWallet("deposit")}
                      className="flex items-center justify-center gap-2 py-3 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-gold-700 to-gold-500 text-casino-darker rounded-xl hover:shadow-lg hover:shadow-gold-600/30 transition-all duration-300"
                    >
                      <Icon name="Plus" size={14} />
                      Пополнить
                    </button>
                    <button
                      onClick={() => openWallet("withdraw")}
                      className="flex items-center justify-center gap-2 py-3 text-xs font-bold tracking-widest uppercase text-white/70 border border-white/10 rounded-xl hover:border-gold-600/40 hover:text-gold-400 transition-all duration-300"
                    >
                      <Icon name="ArrowUpRight" size={14} />
                      Вывести
                    </button>
                    <button
                      onClick={() => openWallet("history")}
                      className="flex items-center justify-center gap-2 py-3 text-xs font-bold tracking-widest uppercase text-white/70 border border-white/10 rounded-xl hover:border-gold-600/40 hover:text-gold-400 transition-all duration-300"
                    >
                      <Icon name="Clock" size={14} />
                      История
                    </button>
                  </div>

                  {!user.welcome_bonus_claimed && (
                    <div className="mt-4 p-4 rounded-xl bg-gold-600/10 border border-gold-600/30 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-gold-400 font-semibold text-sm">🎁 Ваш приветственный бонус ждёт!</p>
                        <p className="text-white/50 text-xs mt-1">+200% к первому депозиту и {user.freespins} фриспинов</p>
                      </div>
                      <button
                        onClick={() => openWallet("deposit")}
                        className="shrink-0 px-5 py-2 text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-gold-600 to-gold-400 text-casino-darker rounded hover:shadow-lg transition-all duration-300"
                      >
                        Пополнить
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                      <h3 className="font-cormorant text-3xl font-semibold text-white">Гость</h3>
                      <p className="text-white/40 text-sm mt-1">Зарегистрируйтесь для доступа к профилю</p>
                    </div>
                    <button
                      onClick={() => openAuth("register")}
                      className="px-8 py-3 text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-gold-700 to-gold-500 text-casino-darker rounded hover:shadow-lg hover:shadow-gold-600/30 transition-all duration-300"
                    >
                      Создать Аккаунт
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Баланс", value: "—", icon: "Wallet" },
                      { label: "Очки лояльности", value: "—", icon: "Star" },
                      { label: "Фриспины", value: "—", icon: "Zap" },
                      { label: "Уровень", value: "—", icon: "Award" },
                    ].map((item) => (
                      <div key={item.label} className="bg-casino-surface rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name={item.icon} fallback="Star" size={14} className="text-gold-500" />
                          <span className="text-white/40 text-xs tracking-wider">{item.label}</span>
                        </div>
                        <div className="font-cormorant text-2xl text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SUPPORT ─── */}
      <section id="support" className="relative z-10 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-xs tracking-widest uppercase font-semibold mb-3">Всегда на связи</p>
            <h2 className="font-cormorant text-5xl md:text-6xl font-light text-white">
              Служба <span className="text-gold-400 italic">Поддержки</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "MessageCircle", title: "Онлайн-чат", desc: "Ответ в течение 1 минуты, 24/7", badge: "● Онлайн" },
              { icon: "Mail", title: "Email", desc: "support@grandroyalcasino.com", badge: "До 4 часов" },
              { icon: "Phone", title: "Телефон", desc: "+7 (800) 000-00-00", badge: "09:00–21:00" },
            ].map((c) => (
              <div key={c.title} className="bg-casino-card border border-casino-border rounded-xl p-6 text-center hover:border-gold-600/40 transition-all duration-300">
                <div className="w-14 h-14 rounded-full bg-gold-600/10 border border-gold-600/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name={c.icon} fallback="MessageCircle" size={22} className="text-gold-400" />
                </div>
                <h3 className="font-cormorant text-xl font-semibold text-white mb-2">{c.title}</h3>
                <p className="text-white/50 text-sm mb-3">{c.desc}</p>
                <span className="text-xs text-green-400 font-semibold">{c.badge}</span>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-cormorant text-3xl font-light text-white text-center mb-8">Часто задаваемые вопросы</h3>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <div key={i} className="bg-casino-card border border-casino-border rounded-xl overflow-hidden hover:border-gold-600/30 transition-all duration-300">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-white/90 text-sm font-medium pr-4">{item.q}</span>
                    <Icon
                      name="ChevronDown"
                      size={18}
                      className={`text-gold-500 shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-white/50 text-sm leading-relaxed border-t border-white/5 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="relative z-10 py-24 px-4 bg-casino-dark/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-xs tracking-widest uppercase font-semibold mb-3">Наша история</p>
            <h2 className="font-cormorant text-5xl md:text-6xl font-light text-white">
              О <span className="text-gold-400 italic">Платформе</span>
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="font-cormorant text-4xl font-light text-white mb-6 leading-snug">
                Роскошь и честность — в каждом вращении
              </h3>
              <p className="text-white/50 leading-relaxed mb-4">
                Grand Royal Casino основан командой профессионалов с многолетним опытом в индустрии азартных игр. Мы создали платформу, где каждый игрок чувствует себя VIP-гостем.
              </p>
              <p className="text-white/50 leading-relaxed mb-8">
                Наша лицензия, провайдеры игр с мировым именем и система честной игры — гарантия вашей уверенности за каждым столом.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "Shield", text: "Лицензия & Безопасность" },
                  { icon: "Zap", text: "Мгновенные выплаты" },
                  { icon: "Globe", text: "30+ провайдеров игр" },
                  { icon: "Lock", text: "SSL шифрование" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 p-4 bg-casino-card rounded-xl border border-casino-border">
                    <Icon name={f.icon} fallback="Shield" size={18} className="text-gold-400 shrink-0" />
                    <span className="text-white/70 text-sm">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "2019", label: "Год основания" },
                { num: "30+", label: "Провайдеров игр" },
                { num: "98K+", label: "Активных игроков" },
                { num: "15 мин", label: "Средний вывод" },
              ].map((s) => (
                <div key={s.label} className="bg-casino-card border border-casino-border rounded-xl p-6 text-center hover:border-gold-600/30 transition-all duration-300">
                  <div className="font-cormorant text-4xl font-semibold text-gold-400 mb-2">{s.num}</div>
                  <div className="text-white/40 text-xs tracking-widest uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-gold-600/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <button onClick={() => scrollTo("home")} className="flex items-center gap-2">
              <span className="text-2xl">♛</span>
              <span className="font-cormorant text-xl font-bold tracking-widest text-gold-400">GRAND ROYAL CASINO</span>
            </button>
            <nav className="flex flex-wrap gap-4 justify-center">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-white/40 hover:text-gold-400 text-xs tracking-widest uppercase transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-xs text-center">© 2024 Grand Royal Casino. Все права защищены. 18+</p>
            <p className="text-white/20 text-xs text-center">Играйте ответственно. Азартные игры могут вызывать зависимость.</p>
          </div>
        </div>
      </footer>

      {/* ─── AUTH MODAL ─── */}
      {authModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-casino-darker/90 backdrop-blur-md" />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-casino-card border border-gold-600/30 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 animate-fade-in">
            {/* Top gold line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">♛</span>
                    <span className="font-cormorant text-sm font-bold tracking-widest text-gold-400 uppercase">Grand Royal</span>
                  </div>
                  <h2 className="font-cormorant text-3xl font-semibold text-white">
                    {authModal === "login" ? "Добро пожаловать" : "Создать аккаунт"}
                  </h2>
                  <p className="text-white/40 text-sm mt-1">
                    {authModal === "login" ? "Войдите в ваш аккаунт" : "Регистрация займёт 30 секунд"}
                  </p>
                </div>
                <button onClick={closeAuth} className="text-white/30 hover:text-white transition-colors">
                  <Icon name="X" size={20} />
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-white/50 text-xs tracking-widest uppercase mb-2 block">Email</label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-casino-surface border border-casino-border rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold-500/60 transition-colors"
                  />
                </div>

                {/* Username (register only) */}
                {authModal === "register" && (
                  <div>
                    <label className="text-white/50 text-xs tracking-widest uppercase mb-2 block">Имя пользователя</label>
                    <input
                      type="text"
                      value={authForm.username}
                      onChange={e => setAuthForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="ваш_никнейм"
                      required
                      minLength={3}
                      className="w-full bg-casino-surface border border-casino-border rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold-500/60 transition-colors"
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="text-white/50 text-xs tracking-widest uppercase mb-2 block">Пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authForm.password}
                      onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="минимум 6 символов"
                      required
                      minLength={6}
                      className="w-full bg-casino-surface border border-casino-border rounded-lg px-4 py-3 pr-10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold-500/60 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                    >
                      <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                    </button>
                  </div>
                </div>

                {/* Error */}
                {authError && (
                  <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {authError}
                  </div>
                )}

                {/* Bonus badge (register) */}
                {authModal === "register" && (
                  <div className="px-4 py-3 rounded-lg bg-gold-600/10 border border-gold-600/20 flex items-center gap-3">
                    <span className="text-xl">🎁</span>
                    <div>
                      <p className="text-gold-400 text-xs font-bold">Бонус новичка</p>
                      <p className="text-white/50 text-xs">+200% к первому депозиту и 200 фриспинов</p>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-gold-700 to-gold-400 text-casino-darker rounded-lg hover:shadow-xl hover:shadow-gold-600/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {authLoading ? "Загрузка..." : authModal === "login" ? "Войти" : "Создать аккаунт"}
                </button>
              </form>

              {/* Switch mode */}
              <p className="text-center text-white/40 text-sm mt-6">
                {authModal === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                <button
                  onClick={() => { setAuthModal(authModal === "login" ? "register" : "login"); setAuthError(""); }}
                  className="text-gold-400 hover:text-gold-300 font-semibold transition-colors"
                >
                  {authModal === "login" ? "Зарегистрироваться" : "Войти"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ─── WALLET MODAL ─── */}
      {walletModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeWallet(); }}
        >
          <div className="absolute inset-0 bg-casino-darker/90 backdrop-blur-md" />

          <div className="relative w-full max-w-md bg-casino-card border border-gold-600/30 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 animate-fade-in">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-cormorant text-3xl font-semibold text-white">
                    {walletModal === "deposit" && "Пополнение"}
                    {walletModal === "withdraw" && "Вывод средств"}
                    {walletModal === "history" && "История операций"}
                  </h2>
                  {user && walletModal !== "history" && (
                    <p className="text-white/40 text-sm mt-1">
                      Текущий баланс: <span className="text-gold-400 font-semibold">{user.balance.toLocaleString('ru-RU')} ₽</span>
                    </p>
                  )}
                </div>
                <button onClick={closeWallet} className="text-white/30 hover:text-white transition-colors">
                  <Icon name="X" size={20} />
                </button>
              </div>

              {/* HISTORY */}
              {walletModal === "history" && (
                <div>
                  {walletLoading ? (
                    <div className="text-center py-10 text-white/30 text-sm">Загрузка...</div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-white/30 text-sm">Операций пока нет</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {transactions.map((t: Transaction) => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-casino-surface rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              t.type === "deposit" ? "bg-green-500/20" : t.type === "withdraw" ? "bg-red-500/20" : "bg-gold-500/20"
                            }`}>
                              <Icon
                                name={t.type === "deposit" ? "ArrowDownLeft" : t.type === "withdraw" ? "ArrowUpRight" : "Gift"}
                                fallback="Wallet"
                                size={14}
                                className={t.type === "deposit" ? "text-green-400" : t.type === "withdraw" ? "text-red-400" : "text-gold-400"}
                              />
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">
                                {t.type === "deposit" ? "Пополнение" : t.type === "withdraw" ? "Вывод" : "Бонус"}
                              </div>
                              <div className="text-white/30 text-xs">
                                {new Date(t.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-cormorant text-lg font-semibold ${
                              t.type === "deposit" || t.type === "bonus" ? "text-green-400" : "text-red-400"
                            }`}>
                              {t.type === "withdraw" ? "−" : "+"}{t.amount.toLocaleString("ru-RU")} ₽
                            </div>
                            <div className={`text-xs ${t.status === "completed" ? "text-green-500/60" : t.status === "pending" ? "text-gold-500/60" : "text-red-500/60"}`}>
                              {t.status === "completed" ? "Выполнено" : t.status === "pending" ? "В обработке" : "Отклонено"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DEPOSIT / WITHDRAW */}
              {(walletModal === "deposit" || walletModal === "withdraw") && (
                <form onSubmit={handleWallet} className="space-y-4">
                  {/* Quick amounts */}
                  <div>
                    <label className="text-white/50 text-xs tracking-widest uppercase mb-3 block">
                      {walletModal === "deposit" ? "Быстрый выбор суммы" : "Сумма вывода"}
                    </label>
                    {walletModal === "deposit" && (
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[1000, 5000, 10000, 50000].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setWalletAmount(v.toString())}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all duration-200 ${
                              walletAmount === v.toString()
                                ? "border-gold-500 bg-gold-600/20 text-gold-400"
                                : "border-white/10 text-white/50 hover:border-gold-600/40 hover:text-gold-400"
                            }`}
                          >
                            {v.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="number"
                        value={walletAmount}
                        onChange={e => setWalletAmount(e.target.value)}
                        placeholder={walletModal === "deposit" ? "Минимум 100 ₽" : "Минимум 500 ₽"}
                        min={walletModal === "deposit" ? 100 : 500}
                        required
                        className="w-full bg-casino-surface border border-casino-border rounded-lg px-4 py-3 pr-10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-gold-500/60 transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500 text-sm font-bold">₽</span>
                    </div>
                  </div>

                  {/* Method */}
                  <div>
                    <label className="text-white/50 text-xs tracking-widest uppercase mb-3 block">Способ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "card", label: "Карта", icon: "CreditCard" },
                        { id: "crypto", label: "Крипто", icon: "Bitcoin" },
                        { id: "sbp", label: "СБП", icon: "Smartphone" },
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setWalletMethod(m.id)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                            walletMethod === m.id
                              ? "border-gold-500 bg-gold-600/15 text-gold-400"
                              : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                          }`}
                        >
                          <Icon name={m.icon} fallback="CreditCard" size={16} />
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Withdraw warning */}
                  {walletModal === "withdraw" && user && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-white/40 text-xs leading-relaxed">
                      Доступно к выводу: <span className="text-white font-semibold">{user.balance.toLocaleString('ru-RU')} ₽</span>. Обработка 15–60 мин.
                    </div>
                  )}

                  {/* Error */}
                  {walletError && (
                    <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {walletError}
                    </div>
                  )}

                  {/* Success */}
                  {walletSuccess && (
                    <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                      <Icon name="CheckCircle" size={16} />
                      {walletSuccess}
                    </div>
                  )}

                  {/* Deposit bonus badge */}
                  {walletModal === "deposit" && user && !user.welcome_bonus_claimed && parseFloat(walletAmount) >= 1000 && (
                    <div className="px-4 py-3 rounded-lg bg-gold-600/10 border border-gold-600/20 text-gold-400 text-xs flex items-center gap-2">
                      🎁 Первый депозит — получите +200% бонус!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={walletLoading || !walletAmount}
                    className="w-full py-3.5 text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-gold-700 to-gold-400 text-casino-darker rounded-lg hover:shadow-xl hover:shadow-gold-600/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {walletLoading
                      ? "Обработка..."
                      : walletModal === "deposit"
                      ? `Пополнить${walletAmount ? ` ${parseFloat(walletAmount).toLocaleString('ru-RU')} ₽` : ""}`
                      : `Вывести${walletAmount ? ` ${parseFloat(walletAmount).toLocaleString('ru-RU')} ₽` : ""}`
                    }
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}