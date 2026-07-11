import React, { useState, useEffect } from "react";
import BrandLogo from '../components/ui/BrandLogo';

// 1. Définition des icônes SVG
const ICONS = {
  student: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c2.5 0 4-1.4 4-4s-1.5-4-4-4-4 1.4-4 4 1.5 4 4 4Z" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  ),
  classroom: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14h3" />
      <path d="M14 14h3" />
    </svg>
  ),
  payment: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M3 11h18" />
      <path d="M7 15h4" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6a2 2 0 0 1 2 2v2H7V5a2 2 0 0 1 2-2Z" />
      <rect x="7" y="7" width="10" height="14" rx="2" />
      <path d="M9.5 12h5" />
      <path d="M9.5 16h5" />
    </svg>
  ),
  creditCard: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  ),
  notebook: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M7 7h10" />
      <path d="M10 11h4" />
      <path d="M10 15h4" />
    </svg>
  ),
  bus: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5" />
      <path d="M4 12h16" />
      <path d="M7 19h3" />
      <path d="M14 19h3" />
      <path d="M5 12v3" />
      <path d="M19 12v3" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 4v5.5c0 5-3.5 8.5-7 9.5-3.5-1-7-4.5-7-9.5V7l7-4Z" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <path d="M8 16v-4" />
      <path d="M12 16v-8" />
      <path d="M16 16v-6" />
      <path d="M4 12h16" opacity="0.15" />
    </svg>
  ),
};

// 2. Données statiques
const STATS = [
  { value: "500+", label: "Élèves gérés", icon: ICONS.student },
  { value: "12", label: "Classes actives", icon: ICONS.classroom },
  { value: "98%", label: "Paiements tracés", icon: ICONS.payment },
  { value: "3", label: "Rôles utilisateurs", icon: ICONS.users },
];

const FEATURES = [
  {
    title: "Inscriptions",
    desc: "Inscrivez vos élèves, affectez-les aux classes et générez automatiquement leurs tranches de paiement.",
    icon: ICONS.clipboard,
    color: "#06B6D4",
    image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Paiements",
    desc: "Suivez chaque versement, consultez les impayés et éditez des factures PDF en un clic.",
    icon: ICONS.creditCard,
    color: "#6D28D9",
    image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Notes & Bulletins",
    desc: "Saisie des notes par matière, calcul automatique des moyennes, bulletins PDF prêts à imprimer.",
    icon: ICONS.notebook,
    color: "#06B6D4",
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Transport",
    desc: "Gérerez les abonnements bus, les mensualités et suivez les impayés de transport par élève.",
    icon: ICONS.bus,
    color: "#6D28D9",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Discipline",
    desc: "Signalez les incidents, appliquez des sanctions et gardez un historique complet par élève.",
    icon: ICONS.shield,
    color: "#06B6D4",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Tableaux de bord",
    desc: "Chaque acteur dispose d'une vue personnalisée avec les indicateurs clés de son périmètre.",
    icon: ICONS.chart,
    color: "#6D28D9",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  },
];

// 3. Composant principal
export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 120);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div style={{ fontFamily: "'Outfit', 'Segoe UI', sans-serif", background: "#0B0F19", color: "#E2E8F0", minHeight: "100vh", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Barre de navigation */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrollY > 60 ? "rgba(6,14,34,0.94)" : "transparent",
        backdropFilter: scrollY > 60 ? "blur(14px)" : "none",
        borderBottom: scrollY > 60 ? "1px solid rgba(6,182,212,0.15)" : "none",
        transition: "all 0.4s ease",
        padding: "0 5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 72,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandLogo />
          <span style={{ fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: 0.5, lineHeight: 1 }}>
            GEP <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 13 }}>Nebula</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {['Fonctionnalités', 'À propos', 'Contact'].map((label) => (
            <a key={label} href="#" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 15, fontWeight: 400, transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#06B6D4')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            >
              {label}
            </a>
          ))}
          <a href="/login" style={{ background: "linear-gradient(135deg, #4C1D95, #06B6D4)", color: "#fff", padding: "10px 22px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14, boxShadow: "0 0 24px rgba(6,182,212,0.28)", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(6,182,212,0.42)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 24px rgba(6,182,212,0.28)'; }}
          >Se connecter</a>
        </div>
      </nav>

      {/* Section Héro */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center", transform: `translateY(${scrollY * 0.18}px)`, filter: "brightness(0.68)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(6,14,34,0.92), rgba(6,182,212,0.18) 60%)" }} />

        <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", top: "18%", left: "10%", background: "radial-gradient(circle, rgba(6,182,212,0.22), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", top: "46%", right: "12%", background: "radial-gradient(circle, rgba(109,40,217,0.18), transparent 68%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 720, marginLeft: "8%", padding: "120px 0 100px", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(30px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(6,182,212,0.22)", borderRadius: 999, padding: "8px 18px", marginBottom: 28 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#06B6D4" }} />
            <span style={{ color: "#C7D2FE", fontSize: 13, fontWeight: 500 }}>Intranet scolaire localisé pour l'enseignement primaire</span>
          </div>

          <h1 style={{ margin: 0, fontSize: "clamp(42px, 6vw, 72px)", lineHeight: 1.02, fontWeight: 900, color: "#fff", letterSpacing: -1.5 }}>
            L'école primaire,
            <span style={{ background: "linear-gradient(90deg, #06B6D4, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> gérée avec précision</span>
          </h1>

          <p style={{ margin: "28px 0 36px", maxWidth: 560, color: "rgba(255,255,255,0.78)", fontSize: 18, lineHeight: 1.75, fontWeight: 300 }}>
            GEP Nebula centralise scolarité, paiements, notes et discipline au sein d'un intranet sécurisé — simple, clair et parfaitement adapté à votre établissement.
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="/login" style={{ padding: "15px 36px", borderRadius: 12, background: "linear-gradient(135deg, #4C1D95, #06B6D4)", color: "#fff", fontWeight: 700, fontSize: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(6,182,212,0.28)", transition: "transform 0.25s, box-shadow 0.25s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 20px 52px rgba(6,182,212,0.38)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(6,182,212,0.28)"; }}
            >
              Accéder à l'application
            </a>
            <a href="#features" style={{ padding: "15px 32px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              Découvrir les modules
            </a>
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section style={{ padding: "72px 8%", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {STATS.map((entry, index) => (
          <div key={entry.label} style={{ padding: 24, borderRadius: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: `opacity 0.5s ease ${index * 0.12}s, transform 0.5s ease ${index * 0.12}s` }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(6,182,212,0.12)", color: "#06B6D4" }}>
              {entry.icon}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{entry.value}</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 400 }}>{entry.label}</div>
          </div>
        ))}
      </section>

      {/* Section Fonctionnalités */}
      <section id="features" style={{ padding: "90px 8%" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 999, padding: "8px 18px", background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)", marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#06B6D4", letterSpacing: "0.16em", textTransform: "uppercase" }}>Modules disponibles</span>
          </div>
          <h2 style={{ margin: 0, fontSize: "clamp(34px, 4vw, 54px)", fontWeight: 900, color: "#fff", lineHeight: 1.08 }}>
            Tout ce dont une école a besoin.
          </h2>
          <p style={{ margin: "20px auto 0", maxWidth: 560, color: "rgba(226,232,240,0.78)", fontSize: 17, lineHeight: 1.75, fontWeight: 300 }}>
            Six modules intégrés et une interface cohérente, pensée pour les équipes administratives et pédagogiques.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 24 }}>
          {FEATURES.map((feature, index) => (
            <div key={feature.title} style={{ overflow: "hidden", borderRadius: 24, background: "#08111F", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 20px 60px rgba(0,0,0,0.16)", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s` }}>
              <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                <img src={feature.image} alt={feature.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.72)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(11,15,25,0.92) 100%)" }} />
              </div>
              <div style={{ padding: 28, display: "grid", gap: 16 }}>
                <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 16, background: feature.color === "#06B6D4" ? "rgba(6,182,212,0.14)" : "rgba(109,40,217,0.14)", color: feature.color }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, color: "#F8FAFC" }}>{feature.title}</h3>
                  <p style={{ margin: "12px 0 0", color: "rgba(226,232,240,0.75)", fontSize: 15, lineHeight: 1.7, fontWeight: 300 }}>{feature.desc}</p>
                </div>
                <span style={{ alignSelf: "flex-start", marginTop: 18, padding: "8px 16px", borderRadius: 999, background: feature.color + "20", color: feature.color, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>
                  Inclus dans GEP
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section Rôles & Accès */}
      <section style={{ background: "linear-gradient(135deg, #100A28 0%, #1E143D 100%)", padding: "90px 8%", borderRadius: 32, border: "1px solid rgba(6,182,212,0.12)", marginBottom: 60, marginLeft: "4%", marginRight: "4%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(6,182,212,0.24)", background: "rgba(6,182,212,0.08)" }}>
              <span style={{ color: "#06B6D4", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>Accès sécurisé</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "clamp(32px, 4vw, 46px)", fontWeight: 900, color: "#fff", lineHeight: 1.08 }}>
              Chaque acteur a <span style={{ color: "#06B6D4" }}>son espace</span>
            </h2>
            <p style={{ margin: "24px 0 32px", maxWidth: 520, fontSize: 16, color: "rgba(226,232,240,0.75)", lineHeight: 1.8, fontWeight: 300 }}>
              Les droits d'accès sont strictement segmentés pour que chaque utilisateur n'accède qu'aux données de son périmètre.
            </p>
            <a href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "14px 30px", borderRadius: 12, background: "linear-gradient(135deg, #06B6D4, #4C1D95)", color: "#fff", fontWeight: 700, textDecoration: "none", boxShadow: "0 12px 32px rgba(6,182,212,0.28)", transition: "transform 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              Se connecter →
            </a>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            {[
              { label: "Administrateur", desc: "Vue complète, configuration du système, gestion des utilisateurs", badge: "#A78BFA" },
              { label: "Secrétaire", desc: "Inscriptions, paiements, transport et exports", badge: "#06B6D4" },
              { label: "Enseignant", desc: "Notes, absences et suivi pédagogique", badge: "#34D399" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: 18, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: item.badge + "22", display: "grid", placeItems: "center", color: item.badge, fontSize: 20 }}>
                  •
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ color: "#fff", fontWeight: 700 }}>{item.label}</span>
                    <span style={{ padding: "4px 12px", borderRadius: 999, background: item.badge + "22", color: item.badge, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>Actif</span>
                  </div>
                  <p style={{ margin: 0, color: "rgba(226,232,240,0.72)", fontSize: 14, lineHeight: 1.7, fontWeight: 300 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appel à l'action final */}
      <section style={{ padding: "110px 8%", textAlign: "center", background: "#0B0F19", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: "radial-gradient(circle at top, rgba(6,182,212,0.25), transparent 40%)" }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, color: "#fff", lineHeight: 1.08 }}>
            Prêt à transformer <span style={{ background: "linear-gradient(90deg, #06B6D4, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>votre école ?</span>
          </h2>
          <p style={{ margin: "22px auto 40px", maxWidth: 520, color: "rgba(226,232,240,0.75)", fontSize: 17, lineHeight: 1.8, fontWeight: 300 }}>
            Connectez-vous depuis n'importe quelle machine du réseau et commencez à piloter votre établissement avec une solution interne dédiée.
          </p>
          <a href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "16px 42px", borderRadius: 14, background: "linear-gradient(135deg, #4C1D95, #06B6D4)", color: "#fff", fontWeight: 800, fontSize: 16, textDecoration: "none", boxShadow: "0 14px 40px rgba(76,29,149,0.28)", transition: "transform 0.25s, box-shadow 0.25s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 18px 50px rgba(76,29,149,0.35)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(76,29,149,0.28)"; }}
          >
            Accéder à GEP Nebula →
          </a>
        </div>
      </section>

      {/* Footer Propre Unique */}
      <footer style={{
        background: "#1E0B3B",
        padding: "40px 8%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        borderTop: "1px solid rgba(6,182,212,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandLogo size={32} radius={8} fontSize={13} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1 }}>
            GEP <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 11 }}>Nebula</span>
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: 0, fontWeight: 300 }}>
          © 2026 GEP Nebula — Génie Informatique — Réseau intranet scolaire
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {["Connexion", "À propos", "Support"].map(l => (
            <a key={l} href="#" style={{
              color: "rgba(255,255,255,0.35)", fontSize: 13,
              textDecoration: "none", fontWeight: 300,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "#06B6D4"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
