import BrandLogo from '../ui/BrandLogo'

export default function LoginHero({ highlights, metrics }) {
	return (
		<section className="login-hero">
			<div className="login-brand-row">
				<BrandLogo size={44} radius={14} fontSize={18} />
				<div>
					<div className="login-brand-name">
						<span>GEP</span>
						<strong>Nebula</strong>
					</div>
					<p className="login-brand-kicker">Accès à la communauté scolaire</p>
				</div>
			</div>

			<span className="login-badge">
				<span className="login-badge-dot" />
				Plateforme de gestion scolaire
			</span>

			<h1>
				Naviguez vers l'avenir de l'éducation avec
				<span> Gep Nebula</span>
			</h1>

			<p className="login-hero-copy">
				Connectez-vous pour piloter les inscriptions, les paiements, les classes et les tableaux de bord de l'école.
			</p>

			<div className="login-highlights">
				{highlights.map(item => (
					<div key={item.title} className={`login-highlight ${item.tone}`}>
						<div className="login-highlight-marker" />
						<div>
							<strong>{item.title}</strong>
							<p>{item.detail}</p>
						</div>
					</div>
				))}
			</div>

			<div className="login-metrics">
				{metrics.map(metric => (
					<div key={metric.label} className="login-metric-card">
						<strong>{metric.value}</strong>
						<span>{metric.label}</span>
					</div>
				))}
			</div>
		</section>
	)
}
